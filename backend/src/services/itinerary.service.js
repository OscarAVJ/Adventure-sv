import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Itinerary } from "../models/Itinerary.js";
import { PromotedPlace } from "../models/PromotedPlace.js";
import { buildItineraryPlanWithAi, buildItinerarySummary, enrichTripContextWithAi } from "./ai.service.js";
import { estimateActivityCost, fitActivitiesToBudget, recalculateDayCosts } from "./cost.service.js";
import { searchCandidatePlaces } from "./googlePlaces.service.js";
import { normalizeTripInput } from "./intent.service.js";
import { findOccasionRule } from "./occasion.service.js";
import { rankPlaces } from "./ranking.service.js";
import { findActiveSeason } from "./season.service.js";
import { upsertTravelerProfile } from "./travelerProfile.service.js";
import { formatReplyText } from "./whatsappFormatter.service.js";
import { getWeatherSummary } from "./weather.service.js";
import { AppError } from "../utils/AppError.js";

const DAY_TIMES = ["10:00", "13:00", "17:00"];

export async function generateItinerary(input) {
  const { userContext, itineraryPayload, occasionRule, season } = await buildItineraryResult(input);
  const savedItinerary = await saveItinerary({ userContext, itineraryPayload });
  const itinerary = {
    id: savedItinerary?._id?.toString() || "itinerary_preview",
    ...itineraryPayload,
  };
  const replyText = formatReplyText({ itinerary, occasionRule, season });

  await saveConversationTurn({ userContext, replyText, itineraryId: savedItinerary?._id });
  await upsertTravelerProfile(userContext);

  return {
    success: true,
    replyText,
    itinerary,
  };
}

export async function buildItineraryResult(input) {
  const userContext = await enrichTripContextWithAi(normalizeTripInput(input));
  const [activeSeason, occasionRule, candidatePlaces] = await Promise.all([
    findActiveSeason(userContext.startDate),
    findOccasionRule(userContext.occasion),
    searchCandidatePlaces(userContext),
  ]);
  const season = getRelevantSeason(activeSeason, userContext);
  const localizedSeason = localizeSeason(season, userContext.lang);
  const localizedOccasionRule = localizeOccasionRule(occasionRule, userContext.lang);

  const promotedPlaces = await findPromotedPlaces(candidatePlaces);
  const rankedPlaces = rankPlaces({ places: candidatePlaces, userContext, promotedPlaces, season, occasionRule });
  if (candidatePlaces.length === 0 || rankedPlaces.length === 0) {
    throw new AppError(
      userContext.lang === "en" ? "No real recommendations were found for this request." : "No se encontraron recomendaciones reales para esta solicitud.",
      404,
      [
        userContext.lang === "en"
          ? "Adjust the trip description or verify the Google Places configuration."
          : "Ajusta la descripcion del viaje o verifica la configuracion de Google Places.",
      ]
    );
  }

  const aiPlan = await buildItineraryPlanWithAi({ userContext, season: localizedSeason, occasionRule: localizedOccasionRule, rankedPlaces });
  if (!aiPlan) {
    throw new AppError(
      userContext.lang === "en" ? "AI could not generate an itinerary for this request." : "No se pudo generar un itinerario con IA para esta solicitud.",
      503,
      [
        userContext.lang === "en"
          ? "Verify the AI configuration or try a more specific description."
          : "Verifica la configuracion de IA o intenta con una descripcion mas especifica.",
      ]
    );
  }

  const selectedPlanByDay = buildSelectedPlanByDay({ aiPlan, rankedPlaces, userContext });
  const days = await buildDays({ userContext, selectedPlanByDay, rankedPlaces, season: localizedSeason, occasionRule: localizedOccasionRule });
  const fitted = fitActivitiesToBudget(days, userContext.budgetUsd, userContext);
  const adjustments = buildAdjustments({
    season: localizedSeason,
    occasionRule: localizedOccasionRule,
    promotedPlaces,
    budgetAdjustment: fitted.adjustment,
    aiPlan,
    lang: userContext.lang,
  });
  const summary = await buildItinerarySummary({ userContext, season: localizedSeason, occasionRule: localizedOccasionRule, days: fitted.days });

  const itineraryPayload = {
    lang: userContext.lang || "es",
    summary,
    context: {
      season: localizedSeason ? { key: localizedSeason.key, label: localizedSeason.label } : null,
      occasion: localizedOccasionRule ? { key: localizedOccasionRule.key, label: localizedOccasionRule.label } : null,
    },
    budgetUsd: userContext.budgetUsd,
    estimatedCostUsd: fitted.estimatedCostUsd,
    adjustments,
    days: fitted.days,
  };

  return {
    userContext,
    itineraryPayload,
    occasionRule: localizedOccasionRule,
    season: localizedSeason,
  };
}

export async function completeExistingItinerary({ itineraryId, input }) {
  const { userContext, itineraryPayload, occasionRule, season } = await buildItineraryResult(input);
  const itinerary = await Itinerary.findByIdAndUpdate(
    itineraryId,
    {
      $set: {
        ...itineraryPayload,
        request: userContext,
        channel: userContext.channel,
        phone: userContext.phone,
        lang: userContext.lang || "es",
        status: "ready",
        errorMessage: null,
      },
    },
    { new: true }
  );

  if (!itinerary) {
    throw new AppError("Itinerario no encontrado.", 404);
  }

  const itineraryResponse = {
    id: itinerary._id.toString(),
    ...itineraryPayload,
  };
  const replyText = formatReplyText({ itinerary: itineraryResponse, occasionRule, season });

  await saveConversationTurn({ userContext, replyText, itineraryId: itinerary._id });
  await upsertTravelerProfile(userContext);

  return {
    userContext,
    replyText,
    itinerary: itineraryResponse,
  };
}

export async function rerollItineraryActivity({ itineraryId, activityId, reason }) {
  if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
    throw new AppError("Itinerario no valido.", 400);
  }

  const itinerary = await Itinerary.findById(itineraryId);
  if (!itinerary) {
    throw new AppError("Itinerario no encontrado.", 404);
  }

  const days = itinerary.days || [];
  const dayIndex = days.findIndex((day) => (day.activities || []).some((activity) => activity.id === activityId));
  if (dayIndex < 0) {
    throw new AppError("Actividad no encontrada.", 404);
  }

  const day = days[dayIndex];
  const activityIndex = (day.activities || []).findIndex((activity) => activity.id === activityId);
  const currentActivity = day.activities[activityIndex];
  const rejectedPlaceIds = new Set([...(itinerary.rejectedPlaceIds || []), currentActivity.googlePlaceId].filter(Boolean));
  const dayPlaceIds = new Set((day.activities || []).map((activity) => activity.googlePlaceId).filter(Boolean));
  const userContext = buildRerollUserContext({ itinerary, day, currentActivity, reason });
  const [activeSeason, occasionRule, candidatePlaces] = await Promise.all([
    findActiveSeason(userContext.startDate),
    findOccasionRule(userContext.occasion),
    searchCandidatePlaces(userContext),
  ]);
  const season = getRelevantSeason(activeSeason, userContext);
  const promotedPlaces = await findPromotedPlaces(candidatePlaces);
  const rankedPlaces = rankPlaces({ places: candidatePlaces, userContext, promotedPlaces, season, occasionRule });
  const replacement = rankedPlaces.find((place) => !rejectedPlaceIds.has(place.googlePlaceId) && !dayPlaceIds.has(place.googlePlaceId));

  if (!replacement) {
    throw new AppError(
      "no_alternative_available",
      409,
      [userContext.lang === "en" ? "We could not find another nearby option in this category." : "No encontramos otra opcion cercana en esta categoria."]
    );
  }

  const nextActivity = buildActivity({
    place: replacement,
    time: currentActivity.time,
    aiReason: buildRerollReason(reason, userContext.lang),
    aiNotes:
      userContext.lang === "en"
        ? "Activity replaced while keeping the day area, category, and budget in mind."
        : "Actividad reemplazada manteniendo la zona, categoria y presupuesto del dia.",
    userContext,
    season,
    occasionRule,
  });
  const plainDay = day.toObject?.() || day;
  const updatedDay = recalculateDayCosts(
    {
      ...plainDay,
      activities: plainDay.activities.map((activity, index) => (index === activityIndex ? nextActivity : activity)),
    },
    userContext
  );

  itinerary.days[dayIndex] = updatedDay;
  itinerary.rejectedPlaceIds = [...rejectedPlaceIds];
  itinerary.estimatedCostUsd = itinerary.days.reduce((sum, item) => sum + Number(item.costUsd || 0), 0);
  itinerary.markModified("days");
  itinerary.markModified("rejectedPlaceIds");
  await itinerary.save();

  return {
    success: true,
    day: updatedDay,
  };
}

async function findPromotedPlaces(candidatePlaces) {
  if (PromotedPlace.db.readyState !== 1) return [];
  const placeIds = candidatePlaces.map((place) => place.googlePlaceId);
  return PromotedPlace.find({ googlePlaceId: { $in: placeIds }, campaignStatus: "active" }).lean();
}

async function buildDays({ userContext, selectedPlanByDay, rankedPlaces, season, occasionRule }) {
  const days = [];

  for (let dayNumber = 1; dayNumber <= userContext.days; dayNumber += 1) {
    const date = addDays(userContext.startDate, dayNumber - 1);
    const dayPlanItems = selectedPlanByDay[dayNumber - 1] || [];
    const dayPlaces = dayPlanItems.map((item) => item.place);
    const dayTheme = userContext.dayThemes?.find((theme) => theme.day === dayNumber);
    const aiDayZone = dayPlanItems.find((item) => item.zone)?.zone;

    const activities = dayPlanItems.map((item, index) =>
      buildActivity({
        place: item.place,
        time: item.time || DAY_TIMES[index],
        aiReason: item.reason,
        aiNotes: item.notes,
        userContext,
        season,
        occasionRule,
      })
    );
    const alternatives = buildDayAlternatives({ dayPlanItems, rankedPlaces, userContext });

    days.push({
      day: dayNumber,
      date,
      zone: aiDayZone || dayTheme?.zone || userContext.preferredZone || dayPlaces[0]?.zone || "El Salvador",
      weatherSummary: await getWeatherSummary({
        date,
        zone: aiDayZone || dayTheme?.zone || userContext.preferredZone || dayPlaces[0]?.zone,
        coordinates: dayPlaces[0]?.coordinates,
      }),
      costUsd: activities.reduce((sum, activity) => sum + activity.costUsd, 0),
      activities,
      alternatives,
    });
  }

  return days.map((day) => ({
    ...day,
    costUsd: day.activities.reduce((sum, activity) => sum + activity.costUsd, 0),
  }));
}

function buildActivity({ place, time, aiReason, aiNotes, userContext, season, occasionRule }) {
  const lang = userContext.lang || "es";
  const seasonal = Boolean(season?.preferredCategories?.some((category) => place.categories.includes(category)));
  const occasionMatch = Boolean(occasionRule?.preferredCategories?.some((category) => place.categories.includes(category)));
  const preferredByUser = isPreferredPlace(place, userContext);
  const featured = Boolean(place.featured);
  const badges = [
    preferredByUser ? translateItineraryText("requestedByTraveler", lang) : null,
    place.openNow ? translateItineraryText("openNow", lang) : null,
    featured ? translateItineraryText("recommended", lang) : null,
    seasonal ? translateItineraryText("seasonal", lang, { label: season.label }) : null,
    occasionMatch ? translateItineraryText("occasionMatch", lang, { label: occasionRule.label }) : null,
    translateItineraryText("withinBudget", lang),
  ].filter(Boolean);

  return {
    id: randomUUID(),
    time,
    name: place.name,
    type: place.type,
    address: place.address,
    googleMapsUrl: place.googleMapsUrl,
    openNow: place.openNow,
    openingHours: place.openingHours || [],
    costUsd: estimateActivityCost(place, userContext.travelers),
    googlePlaceId: place.googlePlaceId,
    coordinates: place.coordinates,
    distanceMeters: place.distanceMeters,
    featured,
    seasonal,
    occasionMatch,
    preferredByUser,
    badges,
    matchReasons: buildMatchReasons({ place, userContext, featured, seasonal, occasionMatch, preferredByUser, aiReason }),
    notes: aiNotes || buildActivityNotes(place, time, lang),
  };
}

function buildRerollUserContext({ itinerary, day, currentActivity, reason }) {
  const request = itinerary.request?.toObject?.() || itinerary.request || {};
  const category = currentActivity.type || "tour";
  const messageByReason = {
    closed: request.lang === "en" ? "Replace a closed activity with a real nearby option." : "Reemplazar una actividad cerrada por una opcion cercana real.",
    rain: request.lang === "en" ? "Replace an activity affected by rain with a real nearby option." : "Reemplazar una actividad afectada por lluvia por una opcion cercana real.",
    disliked: request.lang === "en" ? "Replace an activity the traveler disliked with a real nearby option." : "Reemplazar una actividad que no gusto por una opcion cercana real.",
  };

  return {
    ...request,
    channel: itinerary.channel,
    phone: itinerary.phone,
    message: `${request.message || ""} ${messageByReason[reason] || (request.lang === "en" ? "Replace activity with a real nearby option." : "Reemplazar actividad por una opcion cercana real.")}`.trim(),
    interests: [category, ...(request.interests || [])].filter(Boolean),
    preferredZone: day.zone || request.preferredZone || "El Salvador",
    days: 1,
    startDate: day.date || request.startDate,
    travelers: request.travelers || 1,
    budgetUsd: itinerary.budgetUsd || request.budgetUsd || 0,
    preferredPlaces: [],
    lodgingNearPreferredPlace: false,
  };
}

function buildRerollReason(reason, lang = "es") {
  if (lang === "en") {
    const reasons = {
      closed: "Replacement requested because the previous place was closed.",
      rain: "Replacement requested due to rain conditions.",
      disliked: "Replacement requested based on traveler preference.",
    };

    return reasons[reason] || "Replacement requested by the traveler.";
  }

  const reasons = {
    closed: "Reemplazo solicitado porque el lugar anterior estaba cerrado.",
    rain: "Reemplazo solicitado por condicion de lluvia.",
    disliked: "Reemplazo solicitado por preferencia del viajero.",
  };

  return reasons[reason] || "Reemplazo solicitado por el viajero.";
}

function buildMatchReasons({ place, userContext, featured, seasonal, occasionMatch, preferredByUser, aiReason }) {
  const lang = userContext.lang || "es";
  const reasons = [];
  if (aiReason) reasons.push(aiReason);
  if (preferredByUser) reasons.push(translateItineraryText("preferredReason", lang));
  const matchedInterest = place.categories.find((category) => userContext.interests.includes(category));
  if (matchedInterest) reasons.push(translateItineraryText("interestMatch", lang, { label: matchedInterest }));
  if (userContext.preferredZone && place.zone === userContext.preferredZone) reasons.push(translateItineraryText("nearPreferredZone", lang));
  if (featured) reasons.push(translateItineraryText("featuredReason", lang));
  if (seasonal) reasons.push(translateItineraryText("seasonReason", lang));
  if (occasionMatch) reasons.push(translateItineraryText("occasionReason", lang));
  return reasons;
}

function isPreferredPlace(place, userContext) {
  const preferredPlaces = Array.isArray(userContext.preferredPlaces) ? userContext.preferredPlaces : [];
  if (preferredPlaces.length === 0) return false;

  const placeName = normalizeComparableText(place.name);
  return preferredPlaces.some((preferredPlace) => {
    const normalizedPreferredPlace = normalizeComparableText(preferredPlace);
    return placeName.includes(normalizedPreferredPlace) || normalizedPreferredPlace.includes(placeName);
  });
}

function normalizeComparableText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildActivityNotes(place, time, lang = "es") {
  if (lang === "en") {
    if (time === "10:00") return `Main activity of the day in ${place.zone}.`;
    if (time === "13:00") return "Recommended pause for lunch or rest without moving too far from the route.";
    return "Easy end-of-day stop for a calm and practical experience.";
  }

  if (time === "10:00") return `Actividad principal del dia en ${place.zone}.`;
  if (time === "13:00") return "Pausa recomendada para comer o descansar sin mover demasiado la ruta.";
  return "Cierre del dia pensado para una experiencia tranquila y facil de ejecutar.";
}

function translateItineraryText(key, lang = "es", values = {}) {
  const translations = {
    requestedByTraveler: { es: "Solicitado por el viajero", en: "Requested by the traveler" },
    openNow: { es: "Abierto ahora", en: "Open now" },
    recommended: { es: "Recomendado", en: "Recommended" },
    seasonal: { es: `Ideal en ${values.label}`, en: `Great for ${values.label} season` },
    occasionMatch: { es: `Ideal para ${String(values.label || "").toLowerCase()}`, en: `Good for ${String(values.label || "").toLowerCase()}` },
    withinBudget: { es: "Dentro del presupuesto", en: "Within budget" },
    preferredReason: { es: "Incluido porque el viajero lo menciono como favorito", en: "Included because the traveler mentioned it as a favorite" },
    interestMatch: { es: `Coincide con interes de ${values.label}`, en: `Matches interest in ${values.label}` },
    nearPreferredZone: { es: "Cerca de la zona preferida", en: "Near the preferred area" },
    featuredReason: { es: "Negocio priorizado relevante", en: "Relevant prioritized business" },
    seasonReason: { es: "Encaja con la temporada del viaje", en: "Fits the travel season" },
    occasionReason: { es: "Encaja con la ocasion especial", en: "Fits the special occasion" },
    alternativeReason: { es: "Alternativa compatible si queres cambiar el ritmo del dia.", en: "Compatible alternative if you want to change the day's pace." },
    aiPlanAdjustment: {
      es: "La IA selecciono y ordeno las recomendaciones finales usando solo lugares candidatos verificados.",
      en: "AI selected and ordered the final recommendations using only verified candidate places.",
    },
    seasonAdjustment: {
      es: `Se considero temporada de ${String(values.label || "").toLowerCase()} como boost contextual, sin desplazar la intencion principal.`,
      en: `${values.label} season was considered as context without replacing the main travel intent.`,
    },
    occasionAdjustment: {
      es: `Se agregaron senales compatibles con ${String(values.label || "").toLowerCase()} cuando encajaban con la ruta.`,
      en: `Signals compatible with ${String(values.label || "").toLowerCase()} were added when they fit the route.`,
    },
    promotedAdjustment: {
      es: "Se priorizaron negocios comerciales solo cuando coincidian con intereses, presupuesto y zona.",
      en: "Commercial partners were prioritized only when they matched interests, budget, and area.",
    },
  };

  return translations[key]?.[lang] || translations[key]?.es || "";
}

function localizeSeason(season, lang = "es") {
  if (!season) return null;
  const labels = {
    christmas: { en: "Christmas" },
    holy_week: { en: "Holy Week" },
    surf_season: { en: "surf" },
  };

  return {
    ...season,
    label: lang === "en" ? labels[season.key]?.en || season.label : season.label,
  };
}

function localizeOccasionRule(occasionRule, lang = "es") {
  if (!occasionRule) return null;
  const labels = {
    birthday: { en: "Birthday" },
    anniversary: { en: "Anniversary" },
    family: { en: "Family trip" },
    friends: { en: "Trip with friends" },
    nightlife: { en: "Nightlife" },
    romantic: { en: "Romantic trip" },
    adventure: { en: "Adventure" },
    rest: { en: "Rest" },
  };

  return {
    ...occasionRule,
    label: lang === "en" ? labels[occasionRule.key]?.en || occasionRule.label : occasionRule.label,
  };
}

function buildSelectedPlanByDay({ aiPlan, rankedPlaces, userContext }) {
  const placeById = new Map(rankedPlaces.map((place) => [place.googlePlaceId, place]));
  const selectedDays = Array.from({ length: userContext.days }, () => []);
  const usedPlaceIds = new Set();

  for (const day of aiPlan.days) {
    const dayIndex = day.day - 1;
    if (!selectedDays[dayIndex]) continue;

    selectedDays[dayIndex] = day.activities
      .map((activity) => ({
        place: placeById.get(activity.googlePlaceId),
        time: activity.time,
        reason: activity.reason,
        notes: activity.notes,
        zone: day.zone,
      }))
      .filter((item) => {
        if (!item.place || usedPlaceIds.has(item.place.googlePlaceId)) return false;
        usedPlaceIds.add(item.place.googlePlaceId);
        return true;
      });
  }

  fillSparseDays({ selectedDays, rankedPlaces, usedPlaceIds, userContext });
  return selectedDays;
}

function fillSparseDays({ selectedDays, rankedPlaces, usedPlaceIds, userContext }) {
  const maxActivitiesTotal = Number(userContext.maxActivitiesTotal);
  const hasStrictTotal = Number.isInteger(maxActivitiesTotal) && maxActivitiesTotal > 0;
  const targetPerDay = hasStrictTotal ? 1 : 3;
  const totalLimit = hasStrictTotal ? maxActivitiesTotal : userContext.days * targetPerDay;
  let totalSelected = selectedDays.reduce((sum, day) => sum + day.length, 0);

  for (let dayIndex = 0; dayIndex < selectedDays.length && totalSelected < totalLimit; dayIndex += 1) {
    while (selectedDays[dayIndex].length < targetPerDay && totalSelected < totalLimit) {
      const nextPlace = rankedPlaces.find((place) => !usedPlaceIds.has(place.googlePlaceId));
      if (!nextPlace) return;

      usedPlaceIds.add(nextPlace.googlePlaceId);
      selectedDays[dayIndex].push({
        place: nextPlace,
        time: DAY_TIMES[selectedDays[dayIndex].length] || "17:00",
        reason:
          userContext.lang === "en"
            ? "Option added to complete the day with a real available recommendation."
            : "Opcion agregada para completar el dia con una recomendacion real disponible.",
        notes: buildActivityNotes(nextPlace, DAY_TIMES[selectedDays[dayIndex].length] || "17:00", userContext.lang),
        zone: nextPlace.zone,
      });
      totalSelected += 1;
    }
  }
}

function buildDayAlternatives({ dayPlanItems, rankedPlaces, userContext }) {
  const selectedIds = new Set(dayPlanItems.map((item) => item.place?.googlePlaceId).filter(Boolean));
  return rankedPlaces
    .filter((place) => !selectedIds.has(place.googlePlaceId))
    .filter((place) => isRelevantAlternative(place, userContext))
    .slice(0, 3)
    .map((place) => ({
      name: place.name,
      type: place.type,
      zone: place.zone,
      address: place.address,
      googleMapsUrl: place.googleMapsUrl,
      openNow: place.openNow,
      openingHours: place.openingHours || [],
      estimatedCostUsd: estimateActivityCost(place, userContext.travelers),
      reason: translateItineraryText("alternativeReason", userContext.lang),
      googlePlaceId: place.googlePlaceId,
    }));
}

function isRelevantAlternative(place, userContext) {
  const placeText = normalizeComparableText(`${place.name} ${place.type} ${place.zone}`);
  return userContext.interests.some((interest) => place.categories?.includes(interest) || placeText.includes(normalizeComparableText(interest)));
}

function addDays(dateValue, amount) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function buildAdjustments({ season, occasionRule, promotedPlaces, budgetAdjustment, aiPlan, lang = "es" }) {
  return [
    aiPlan ? translateItineraryText("aiPlanAdjustment", lang) : null,
    ...(aiPlan?.adjustments || []),
    season ? translateItineraryText("seasonAdjustment", lang, { label: season.label }) : null,
    occasionRule ? translateItineraryText("occasionAdjustment", lang, { label: occasionRule.label }) : null,
    promotedPlaces.length > 0 ? translateItineraryText("promotedAdjustment", lang) : null,
    budgetAdjustment,
  ].filter(Boolean);
}

function getRelevantSeason(season, userContext) {
  if (!season) return null;
  const preferredCategories = season.preferredCategories || [];
  const matchesInterest = preferredCategories.some((category) => userContext.interests.includes(category));
  const matchesMessage = preferredCategories.some((category) => normalizeComparableText(userContext.message).includes(normalizeComparableText(category)));
  return matchesInterest || matchesMessage ? season : null;
}

async function saveItinerary({ userContext, itineraryPayload }) {
  if (mongoose.connection.readyState !== 1) return null;

  return Itinerary.create({
    channel: userContext.channel,
    phone: userContext.phone,
    request: userContext,
    ...itineraryPayload,
  });
}

async function saveConversationTurn({ userContext, replyText, itineraryId }) {
  if (mongoose.connection.readyState !== 1 || !["whatsapp", "telegram"].includes(userContext.channel)) return;

  const query = userContext.conversationId
    ? buildConversationQuery(userContext)
    : { phone: userContext.phone, channel: userContext.channel, status: "active" };

  await Conversation.findOneAndUpdate(
    query,
    {
      $setOnInsert: { channel: userContext.channel, phone: userContext.phone, status: "active" },
      $set: { lastItineraryId: itineraryId, lang: userContext.lang || "es" },
      $push: {
        messages: [
          { role: "user", content: userContext.message },
          { role: "assistant", content: replyText },
        ],
      },
    },
    { upsert: true, new: true }
  );
}

function buildConversationQuery(userContext) {
  return mongoose.Types.ObjectId.isValid(userContext.conversationId)
    ? { _id: userContext.conversationId }
    : { phone: userContext.phone, channel: userContext.channel, status: "active" };
}
