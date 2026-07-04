import { env } from "../config/env.js";
import { normalizeText } from "./intent.service.js";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_GENERATE_CONTENT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const ALLOWED_INTERESTS = [
  "playa",
  "surf",
  "cultura",
  "naturaleza",
  "hospedaje",
  "comida",
  "tour",
  "romantico",
  "familia",
  "aventura",
];

const ALLOWED_OCCASIONS = ["birthday", "anniversary", "family", "friends", "romantic", "adventure", "rest"];

export async function enrichTripContextWithAi(userContext) {
  if (!isAiEnabled() || !userContext.message) return userContext;

  try {
    const aiContext = await requestTripContext(userContext);
    return mergeAiContext(userContext, aiContext);
  } catch (error) {
    console.warn("AI context enrichment unavailable", error.message);
    return userContext;
  }
}

export async function buildItinerarySummary({ userContext, season, occasionRule, days = [] }) {
  if (isAiEnabled()) {
    try {
      const summary = await requestItinerarySummary({ userContext, season, occasionRule, days });
      if (summary) return summary;
    } catch (error) {
      console.warn("AI itinerary summary unavailable", error.message);
    }
  }

  const interestText = userContext.interests.join(", ");
  const occasionText = occasionRule ? ` para ${occasionRule.label.toLowerCase()}` : "";
  const seasonText = season ? ` en temporada de ${season.label.toLowerCase()}` : "";
  return `${userContext.days} dias de ${interestText}${occasionText}${seasonText}.`;
}

export async function buildItineraryPlanWithAi({ userContext, season, occasionRule, rankedPlaces }) {
  if (!isAiEnabled() || rankedPlaces.length === 0) return null;

  try {
    const result = await requestItineraryPlan({ userContext, season, occasionRule, rankedPlaces });
    return sanitizeItineraryPlan(result, rankedPlaces, userContext.days);
  } catch (error) {
    console.warn("AI itinerary planning unavailable", error.message);
    return null;
  }
}

function isAiEnabled() {
  return ["openai", "gemini"].includes(env.aiProvider) && Boolean(env.aiApiKey);
}

async function requestTripContext(userContext) {
  return requestAiJson({
    system: [
      "Eres un analista de intencion para un planificador turistico de El Salvador.",
      "Devuelve solo JSON valido.",
      "No inventes precios ni lugares especificos.",
      "No asignes una zona preferida si el usuario no la menciona explicitamente.",
      "No agregues zonas especificas en las busquedas si el usuario no las pidio.",
      "Tu trabajo es mejorar busquedas para Google Places y organizar temas por dia.",
    ].join(" "),
    user: JSON.stringify({
      task: "Analiza la necesidad del usuario y devuelve contexto normalizado.",
      allowedInterests: ALLOWED_INTERESTS,
      allowedOccasions: ALLOWED_OCCASIONS,
      expectedSchema: {
        interests: ["playa"],
        preferredZone: "zona mencionada explicitamente por el usuario | null",
        occasion: "anniversary | null",
        travelStyle: "relaxed | balanced | active | romantic | family | budget",
        searchQueries: ["surf El Tunco El Salvador"],
        dayThemes: [
          {
            day: 1,
            zone: "El Tunco",
            interests: ["playa", "comida"],
            title: "Playa y comida local",
          },
        ],
      },
      currentContext: userContext,
      message: userContext.message,
    }),
  });
}

async function requestItinerarySummary({ userContext, season, occasionRule, days }) {
  const result = await requestAiJson({
    system: [
      "Eres un redactor de producto para Adventure-sv.",
      "Resume itinerarios turisticos de El Salvador en espanol claro.",
      "Devuelve solo JSON valido con la propiedad summary.",
      "No prometas reservas, seguridad garantizada, clima garantizado ni precios exactos.",
    ].join(" "),
    user: JSON.stringify({
      expectedSchema: { summary: "string de maximo 160 caracteres" },
      userContext,
      season: season ? { key: season.key, label: season.label } : null,
      occasion: occasionRule ? { key: occasionRule.key, label: occasionRule.label } : null,
      days: days.map((day) => ({
        day: day.day,
        zone: day.zone,
        activities: day.activities.map((activity) => ({
          name: activity.name,
          type: activity.type,
        })),
      })),
    }),
  });

  return typeof result.summary === "string" ? result.summary.slice(0, 180) : null;
}

async function requestItineraryPlan({ userContext, season, occasionRule, rankedPlaces }) {
  const candidates = rankedPlaces.slice(0, 30).map((place) => ({
    googlePlaceId: place.googlePlaceId,
    name: place.name,
    type: place.type,
    categories: place.categories,
    zone: place.zone,
    rating: place.rating,
    score: Math.round(place.score || 0),
    featured: Boolean(place.featured),
    openNow: Boolean(place.openNow),
  }));

  return requestAiJson({
    system: [
      "Eres el planificador principal de itinerarios de Adventure-sv para El Salvador.",
      "Debes seleccionar lugares SOLO desde la lista de candidatos recibida.",
      "Nunca inventes googlePlaceId, nombres, precios, zonas ni lugares.",
      "Arma una ruta ejecutable, agrupada por cercania, presupuesto, intereses, temporada y ocasion.",
      "Los lugares featured pueden priorizarse solo si son relevantes para la necesidad real.",
      "Devuelve solo JSON valido.",
    ].join(" "),
    user: JSON.stringify({
      task: "Selecciona y organiza el itinerario final usando exclusivamente candidatePlaces.",
      rules: [
        "Usa maximo 3 actividades por dia.",
        "No repitas googlePlaceId salvo que no haya suficientes candidatos.",
        "No favorezcas una zona que el usuario no pidio si hay candidatos relevantes para su intencion principal.",
        "Si hay ocasion especial, agrega al menos una actividad compatible cuando exista candidato relevante.",
        "Si hay temporada, favorece opciones compatibles sin desplazar la intencion principal.",
        "Mantén rutas por dia geograficamente coherentes.",
      ],
      expectedSchema: {
        days: [
          {
            day: 1,
            zone: "El Tunco",
            activities: [
              {
                googlePlaceId: "id existente de candidatePlaces",
                time: "10:00",
                reason: "Por que este lugar encaja",
                notes: "Nota breve para el usuario",
              },
            ],
          },
        ],
        adjustments: ["Decisiones relevantes tomadas por la IA"],
      },
      allowedTimes: ["09:00", "10:00", "13:00", "14:00", "17:00", "19:00"],
      userContext,
      season: season ? { key: season.key, label: season.label, preferredCategories: season.preferredCategories } : null,
      occasion: occasionRule
        ? { key: occasionRule.key, label: occasionRule.label, preferredCategories: occasionRule.preferredCategories }
        : null,
      candidatePlaces: candidates,
    }),
  });
}

async function requestAiJson({ system, user }) {
  if (env.aiProvider === "gemini") {
    return requestGeminiJson({ system, user });
  }

  return requestOpenAiJson({ system, user });
}

async function requestOpenAiJson({ system, user }) {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.aiApiKey}`,
    },
    body: JSON.stringify({
      model: env.aiModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText.slice(0, 180)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response did not include content");

  return JSON.parse(content);
}

async function requestGeminiJson({ system, user }) {
  const model = encodeURIComponent(env.aiModel.startsWith("models/") ? env.aiModel.slice("models/".length) : env.aiModel);
  const url = `${GEMINI_GENERATE_CONTENT_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(env.aiApiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: user }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText.slice(0, 180)}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!content) throw new Error("Gemini response did not include content");

  return JSON.parse(content);
}

function mergeAiContext(userContext, aiContext) {
  const aiInterests = sanitizeInterests(aiContext.interests);
  const interests = [...new Set([...userContext.interests, ...aiInterests])];
  const preferredZone = userContext.preferredZone || null;
  const occasion = ALLOWED_OCCASIONS.includes(aiContext.occasion) ? aiContext.occasion : userContext.occasion;
  const searchQueries = sanitizeSearchQueries(aiContext.searchQueries, { ...userContext, interests, preferredZone });
  const dayThemes = sanitizeDayThemes(aiContext.dayThemes, userContext.days);

  return {
    ...userContext,
    interests: interests.length > 0 ? interests : userContext.interests,
    preferredZone,
    occasion,
    travelStyle: sanitizeText(aiContext.travelStyle) || "balanced",
    aiSearchQueries: searchQueries,
    dayThemes,
  };
}

function sanitizeInterests(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeText).filter((interest) => ALLOWED_INTERESTS.includes(interest));
}

function sanitizeSearchQueries(value, userContext) {
  const fallbackQuery = `${userContext.interests.join(" ")} ${userContext.preferredZone || ""} El Salvador`;
  const queries = Array.isArray(value) ? value : [];

  return [...new Set([...queries, fallbackQuery])]
    .map((query) => sanitizeText(query))
    .filter(Boolean)
    .map((query) => (normalizeText(query).includes("el salvador") ? query : `${query} El Salvador`))
    .slice(0, 6);
}

function sanitizeDayThemes(value, days) {
  if (!Array.isArray(value)) return [];

  return value
    .map((theme, index) => ({
      day: Number(theme.day || index + 1),
      zone: sanitizeText(theme.zone),
      interests: sanitizeInterests(theme.interests),
      title: sanitizeText(theme.title),
    }))
    .filter((theme) => theme.day >= 1 && theme.day <= days)
    .slice(0, days);
}

function sanitizeText(value) {
  return typeof value === "string" ? value.trim().slice(0, 140) : "";
}

function sanitizeItineraryPlan(plan, rankedPlaces, expectedDays) {
  if (!plan || !Array.isArray(plan.days)) return null;

  const placeIds = new Set(rankedPlaces.map((place) => place.googlePlaceId));
  const usedPlaceIds = new Set();
  const days = plan.days
    .map((day, index) => ({
      day: Number(day.day || index + 1),
      zone: sanitizeText(day.zone),
      activities: sanitizePlanActivities(day.activities, placeIds, usedPlaceIds),
    }))
    .filter((day) => day.day >= 1 && day.day <= expectedDays && day.activities.length > 0)
    .slice(0, expectedDays);

  if (days.length === 0) return null;

  return {
    days,
    adjustments: Array.isArray(plan.adjustments) ? plan.adjustments.map(sanitizeText).filter(Boolean).slice(0, 4) : [],
  };
}

function sanitizePlanActivities(activities, placeIds, usedPlaceIds) {
  if (!Array.isArray(activities)) return [];

  return activities
    .map((activity, index) => ({
      googlePlaceId: sanitizeText(activity.googlePlaceId),
      time: sanitizeTime(activity.time, index),
      reason: sanitizeText(activity.reason),
      notes: sanitizeText(activity.notes),
    }))
    .filter((activity) => {
      if (!placeIds.has(activity.googlePlaceId)) return false;
      if (usedPlaceIds.has(activity.googlePlaceId)) return false;
      usedPlaceIds.add(activity.googlePlaceId);
      return true;
    })
    .slice(0, 3);
}

function sanitizeTime(value, index) {
  const allowedTimes = ["09:00", "10:00", "13:00", "14:00", "17:00", "19:00"];
  return allowedTimes.includes(value) ? value : ["10:00", "13:00", "17:00"][index] || "17:00";
}
