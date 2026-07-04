import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Itinerary } from "../models/Itinerary.js";
import { PromotedPlace } from "../models/PromotedPlace.js";
import { buildItineraryPlanWithAi, buildItinerarySummary, enrichTripContextWithAi } from "./ai.service.js";
import { estimateActivityCost, fitActivitiesToBudget } from "./cost.service.js";
import { searchCandidatePlaces } from "./googlePlaces.service.js";
import { normalizeTripInput } from "./intent.service.js";
import { findOccasionRule } from "./occasion.service.js";
import { rankPlaces } from "./ranking.service.js";
import { findActiveSeason } from "./season.service.js";
import { formatReplyText } from "./whatsappFormatter.service.js";
import { getWeatherSummary } from "./weather.service.js";
import { AppError } from "../utils/AppError.js";

const DAY_TIMES = ["10:00", "13:00", "17:00"];

export async function generateItinerary(input) {
  const userContext = await enrichTripContextWithAi(normalizeTripInput(input));
  const [season, occasionRule, candidatePlaces] = await Promise.all([
    findActiveSeason(userContext.startDate),
    findOccasionRule(userContext.occasion),
    searchCandidatePlaces(userContext),
  ]);

  const promotedPlaces = await findPromotedPlaces(candidatePlaces);
  const rankedPlaces = rankPlaces({ places: candidatePlaces, userContext, promotedPlaces, season, occasionRule });
  if (candidatePlaces.length === 0 || rankedPlaces.length === 0) {
    throw new AppError(
      "No se encontraron recomendaciones reales para esta solicitud.",
      404,
      ["Ajusta la descripcion del viaje o verifica la configuracion de Google Places."]
    );
  }

  const aiPlan = await buildItineraryPlanWithAi({ userContext, season, occasionRule, rankedPlaces });
  if (!aiPlan) {
    throw new AppError(
      "No se pudo generar un itinerario con IA para esta solicitud.",
      503,
      ["Verifica la configuracion de IA o intenta con una descripcion mas especifica."]
    );
  }

  const selectedPlanByDay = buildSelectedPlanByDay({ aiPlan, candidatePlaces, userContext });
  const days = await buildDays({ userContext, selectedPlanByDay, season, occasionRule });
  const fitted = fitActivitiesToBudget(days, userContext.budgetUsd);
  const adjustments = buildAdjustments({
    season,
    occasionRule,
    promotedPlaces,
    budgetAdjustment: fitted.adjustment,
    aiPlan,
  });
  const summary = await buildItinerarySummary({ userContext, season, occasionRule, days: fitted.days });

  const itineraryPayload = {
    summary,
    context: {
      season: season ? { key: season.key, label: season.label } : null,
      occasion: occasionRule ? { key: occasionRule.key, label: occasionRule.label } : null,
    },
    budgetUsd: userContext.budgetUsd,
    estimatedCostUsd: fitted.estimatedCostUsd,
    adjustments,
    days: fitted.days,
  };

  const savedItinerary = await saveItinerary({ userContext, itineraryPayload });
  const itinerary = {
    id: savedItinerary?._id?.toString() || "itinerary_preview",
    ...itineraryPayload,
  };
  const replyText = formatReplyText({ itinerary, occasionRule, season });

  await saveConversationTurn({ userContext, replyText, itineraryId: savedItinerary?._id });

  return {
    success: true,
    replyText,
    itinerary,
  };
}

async function findPromotedPlaces(candidatePlaces) {
  if (PromotedPlace.db.readyState !== 1) return [];
  const placeIds = candidatePlaces.map((place) => place.googlePlaceId);
  return PromotedPlace.find({ googlePlaceId: { $in: placeIds }, campaignStatus: "active" }).lean();
}

async function buildDays({ userContext, selectedPlanByDay, season, occasionRule }) {
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
    });
  }

  return days.map((day) => ({
    ...day,
    costUsd: day.activities.reduce((sum, activity) => sum + activity.costUsd, 0),
  }));
}

function buildActivity({ place, time, aiReason, aiNotes, userContext, season, occasionRule }) {
  const seasonal = Boolean(season?.preferredCategories?.some((category) => place.categories.includes(category)));
  const occasionMatch = Boolean(occasionRule?.preferredCategories?.some((category) => place.categories.includes(category)));
  const featured = Boolean(place.featured);
  const badges = [
    place.openNow ? "Abierto ahora" : null,
    featured ? "Recomendado" : null,
    seasonal ? `Ideal en ${season.label}` : null,
    occasionMatch ? `Ideal para ${occasionRule.label.toLowerCase()}` : null,
    "Dentro del presupuesto",
  ].filter(Boolean);

  return {
    time,
    name: place.name,
    type: place.type,
    costUsd: estimateActivityCost(place, userContext.travelers),
    googlePlaceId: place.googlePlaceId,
    coordinates: place.coordinates,
    featured,
    seasonal,
    occasionMatch,
    badges,
    matchReasons: buildMatchReasons({ place, userContext, featured, seasonal, occasionMatch, aiReason }),
    notes: aiNotes || buildActivityNotes(place, time),
  };
}

function buildMatchReasons({ place, userContext, featured, seasonal, occasionMatch, aiReason }) {
  const reasons = [];
  if (aiReason) reasons.push(aiReason);
  const matchedInterest = place.categories.find((category) => userContext.interests.includes(category));
  if (matchedInterest) reasons.push(`Coincide con interes de ${matchedInterest}`);
  if (userContext.preferredZone && place.zone === userContext.preferredZone) reasons.push("Cerca de la zona preferida");
  if (featured) reasons.push("Negocio priorizado relevante");
  if (seasonal) reasons.push("Encaja con la temporada del viaje");
  if (occasionMatch) reasons.push("Encaja con la ocasion especial");
  return reasons;
}

function buildActivityNotes(place, time) {
  if (time === "10:00") return `Actividad principal del dia en ${place.zone}.`;
  if (time === "13:00") return "Pausa recomendada para comer o descansar sin mover demasiado la ruta.";
  return "Cierre del dia pensado para una experiencia tranquila y facil de ejecutar.";
}

function buildSelectedPlanByDay({ aiPlan, candidatePlaces, userContext }) {
  const placeById = new Map(candidatePlaces.map((place) => [place.googlePlaceId, place]));

  const selectedDays = Array.from({ length: userContext.days }, () => []);

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
      .filter((item) => item.place);
  }

  return selectedDays;
}

function addDays(dateValue, amount) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function buildAdjustments({ season, occasionRule, promotedPlaces, budgetAdjustment, aiPlan }) {
  return [
    aiPlan ? "La IA selecciono y ordeno las recomendaciones finales usando solo lugares candidatos verificados." : null,
    ...(aiPlan?.adjustments || []),
    season ? `Se considero temporada de ${season.label.toLowerCase()} como boost contextual, sin desplazar la intencion principal.` : null,
    occasionRule ? `Se agregaron senales compatibles con ${occasionRule.label.toLowerCase()} cuando encajaban con la ruta.` : null,
    promotedPlaces.length > 0 ? "Se priorizaron negocios comerciales solo cuando coincidian con intereses, presupuesto y zona." : null,
    budgetAdjustment,
  ].filter(Boolean);
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
  if (mongoose.connection.readyState !== 1 || userContext.channel !== "whatsapp") return;

  const query = userContext.conversationId
    ? buildConversationQuery(userContext)
    : { phone: userContext.phone, channel: "whatsapp", status: "active" };

  await Conversation.findOneAndUpdate(
    query,
    {
      $setOnInsert: { channel: "whatsapp", phone: userContext.phone, status: "active" },
      $set: { lastItineraryId: itineraryId },
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
    : { phone: userContext.phone, channel: "whatsapp", status: "active" };
}
