import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export async function searchCandidatePlaces(userContext) {
  if (!env.googleMapsApiKey) {
    throw new AppError("Google Places no esta configurado.", 503, ["Configura GOOGLE_MAPS_API_KEY para obtener lugares reales."]);
  }

  const queries = buildPlacesQueries(userContext);
  const places = [];

  for (const query of queries) {
    const results = await fetchGooglePlaces(query, userContext);
    places.push(...results);
  }

  const uniquePlaces = dedupePlaces(places);
  return uniquePlaces;
}

async function fetchGooglePlaces(query, userContext) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleMapsApiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.types",
        "places.currentOpeningHours.openNow",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "es",
      regionCode: "SV",
      maxResultCount: 10,
    }),
  });

  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    throw new AppError("Google Places no pudo devolver recomendaciones.", 502, [
      `Google Places HTTP status: ${response.status}`,
      errorBody?.error?.message || "Sin detalle adicional de Google Places.",
    ]);
  }

  const data = await response.json();
  return (data.places || []).map((place) => mapGooglePlace(place, userContext));
}

function buildPlacesQueries(userContext) {
  const zone = userContext.preferredZone || "El Salvador";
  const message = String(userContext.message || "").trim();
  const interests = Array.isArray(userContext.interests) ? userContext.interests : [];
  const aiQueries = Array.isArray(userContext.aiSearchQueries) ? userContext.aiSearchQueries : [];

  const queryCandidates = [
    ...aiQueries,
    message ? `${message} ${zone}` : null,
    interests.length > 0 ? `${interests.join(" ")} lugares turisticos ${zone}` : null,
    interests.length > 0 ? `${interests.join(" ")} atracciones turisticas ${zone}` : null,
    ...interests.map((interest) => `${interest} lugares turisticos ${zone}`),
    `centros turisticos ${zone}`,
  ];

  return [...new Set(queryCandidates.map(normalizeQuery).filter(Boolean))]
    .map((query) => (query.toLowerCase().includes("el salvador") ? query : `${query} El Salvador`))
    .slice(0, 10);
}

function dedupePlaces(places) {
  const seen = new Set();
  return places
    .filter((place) => {
      if (!place.googlePlaceId || seen.has(place.googlePlaceId)) return false;
      seen.add(place.googlePlaceId);
      return hasValidCoordinates(place.coordinates);
    })
    .slice(0, 30);
}

function mapGooglePlace(place, userContext) {
  const inferredType = userContext.interests[0] || "tour";
  return {
    name: place.displayName?.text || "Lugar turistico",
    type: inferredType,
    categories: inferCategoriesFromGooglePlace(place, userContext),
    zone: userContext.preferredZone || place.formattedAddress || "El Salvador",
    googlePlaceId: place.id,
    rating: place.rating || 0,
    coordinates: {
      lat: place.location?.latitude,
      lng: place.location?.longitude,
    },
    openNow: place.currentOpeningHours?.openNow,
  };
}

function hasValidCoordinates(coordinates) {
  return Number.isFinite(Number(coordinates?.lat)) && Number.isFinite(Number(coordinates?.lng));
}

function normalizeQuery(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function inferCategoriesFromGooglePlace(place, userContext) {
  const types = place.types || [];
  const categories = new Set(userContext.interests);
  if (types.includes("restaurant") || types.includes("food")) categories.add("comida");
  if (types.includes("lodging")) categories.add("hospedaje");
  if (types.includes("tourist_attraction")) categories.add("tour");
  if (types.includes("natural_feature") || types.includes("park")) categories.add("naturaleza");
  return [...categories];
}
