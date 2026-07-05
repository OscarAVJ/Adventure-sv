import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export async function searchCandidatePlaces(userContext) {
  if (!env.googleMapsApiKey) {
    throw new AppError("Google Places no esta configurado.", 503, ["Configura GOOGLE_MAPS_API_KEY para obtener lugares reales."]);
  }

  const queries = buildPlacesQueries(userContext);
  const locationBias = await resolveLocationBias(userContext.preferredZone);
  const places = [];

  for (const query of queries) {
    const results = await fetchGooglePlaces(query, userContext, locationBias);
    places.push(...results);
  }

  const uniquePlaces = dedupePlaces(places);
  return filterAndSortByDistance(uniquePlaces, locationBias);
}

async function fetchGooglePlaces(query, userContext, locationBias = null) {
  const body = {
    textQuery: query,
    languageCode: "es",
    regionCode: "SV",
    maxResultCount: 10,
  };

  if (locationBias) {
    body.locationBias = {
      circle: {
        center: locationBias.center,
        radius: locationBias.radiusMeters,
      },
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleMapsApiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.googleMapsUri",
        "places.location",
        "places.rating",
        "places.types",
        "places.currentOpeningHours.openNow",
        "places.currentOpeningHours.weekdayDescriptions",
      ].join(","),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    throw new AppError("Google Places no pudo devolver recomendaciones.", 502, [
      `Google Places HTTP status: ${response.status}`,
      errorBody?.error?.message || "Sin detalle adicional de Google Places.",
    ]);
  }

  const data = await response.json();
  return (data.places || []).map((place) => mapGooglePlace(place, userContext, locationBias));
}

function buildPlacesQueries(userContext) {
  const zone = userContext.preferredZone || "El Salvador";
  const message = String(userContext.message || "").trim();
  const interests = Array.isArray(userContext.interests) ? userContext.interests : [];
  const preferredPlaces = Array.isArray(userContext.preferredPlaces) ? userContext.preferredPlaces : [];
  const aiQueries = Array.isArray(userContext.aiSearchQueries) ? userContext.aiSearchQueries : [];
  const expandedInterests = expandInterestsForSearch(interests);
  const nearbyHotelQueries = userContext.lodgingNearPreferredPlace
    ? preferredPlaces.flatMap((place) => [`hotel cerca de ${place} ${zone}`, `hoteles cerca de ${place} ${zone}`])
    : [];

  const queryCandidates = [
    ...preferredPlaces.map((place) => `${place} ${zone}`),
    ...preferredPlaces.map((place) => `${place} bar discoteca ${zone}`),
    ...nearbyHotelQueries,
    ...aiQueries,
    message ? `${message} ${zone}` : null,
    expandedInterests.length > 0 ? `${expandedInterests.join(" ")} ${zone}` : null,
    expandedInterests.length > 0 ? `${expandedInterests.join(" ")} lugares recomendados ${zone}` : null,
    ...expandedInterests.map((interest) => `${interest} ${zone}`),
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

async function resolveLocationBias(preferredZone) {
  const zoneQuery = cleanZoneQuery(preferredZone);
  if (!zoneQuery) return null;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleMapsApiKey,
      "X-Goog-FieldMask": ["places.displayName", "places.formattedAddress", "places.location"].join(","),
    },
    body: JSON.stringify({
      textQuery: `${zoneQuery} El Salvador`,
      languageCode: "es",
      regionCode: "SV",
      maxResultCount: 1,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const place = data.places?.[0];
  const lat = place?.location?.latitude;
  const lng = place?.location?.longitude;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;

  return {
    label: place.displayName?.text || zoneQuery,
    address: place.formattedAddress || zoneQuery,
    center: {
      latitude: lat,
      longitude: lng,
    },
    radiusMeters: 12000,
  };
}

function mapGooglePlace(place, userContext, locationBias = null) {
  const inferredType = userContext.interests[0] || "tour";
  const coordinates = {
    lat: place.location?.latitude,
    lng: place.location?.longitude,
  };
  const distanceMeters = locationBias ? calculateDistanceMeters(locationBias.center, coordinates) : null;

  return {
    name: place.displayName?.text || "Lugar turistico",
    type: inferredType,
    address: place.formattedAddress || null,
    googleMapsUrl: place.googleMapsUri || buildGoogleMapsUrl(place),
    categories: inferCategoriesFromGooglePlace(place, userContext),
    zone: place.formattedAddress || userContext.preferredZone || "El Salvador",
    googlePlaceId: place.id,
    rating: place.rating || 0,
    coordinates,
    distanceMeters,
    openNow: place.currentOpeningHours?.openNow,
    openingHours: place.currentOpeningHours?.weekdayDescriptions || [],
  };
}

function buildGoogleMapsUrl(place) {
  if (place.id) return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.id)}`;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return null;
}

function hasValidCoordinates(coordinates) {
  return Number.isFinite(Number(coordinates?.lat)) && Number.isFinite(Number(coordinates?.lng));
}

function normalizeQuery(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanZoneQuery(value) {
  return String(value || "")
    .replace(/\b(?:cerca de|cerca del|por|en)\b/gi, "")
    .replace(/\bmarcella\b/gi, "Marsella")
    .replace(/\s+/g, " ")
    .trim();
}

function filterAndSortByDistance(places, locationBias) {
  if (!locationBias) return places;

  const nearbyPlaces = places
    .filter((place) => Number.isFinite(Number(place.distanceMeters)))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const withinRadius = nearbyPlaces.filter((place) => place.distanceMeters <= locationBias.radiusMeters);
  if (withinRadius.length > 0) return withinRadius.slice(0, 30);

  return nearbyPlaces.filter((place) => place.distanceMeters <= 20000).slice(0, 15);
}

function calculateDistanceMeters(center, coordinates) {
  const lat1 = Number(center?.latitude);
  const lng1 = Number(center?.longitude);
  const lat2 = Number(coordinates?.lat);
  const lng2 = Number(coordinates?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;

  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function expandInterestsForSearch(interests) {
  const expansions = {
    vida_nocturna: ["bares", "discotecas", "vida nocturna", "night clubs"],
    bebidas: ["bares", "cervecerias", "cocteles"],
    musica: ["musica en vivo", "karaoke", "discotecas"],
    comida: ["restaurantes", "comida local"],
    cultura: ["museos", "centro historico", "sitios culturales"],
    naturaleza: ["parques naturales", "volcanes", "lagos"],
    compras: ["mercados", "artesanias", "centros comerciales"],
    bienestar: ["spa", "termales", "masajes"],
  };

  return [
    ...new Set(
      interests.flatMap((interest) => {
        const normalized = normalizeQuery(interest);
        return [normalized, ...(expansions[normalized] || [])];
      })
    ),
  ].filter(Boolean);
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
  const categories = new Set();
  if (types.includes("bar") || types.includes("night_club")) categories.add("vida_nocturna");
  if (types.includes("bar") || types.includes("liquor_store")) categories.add("bebidas");
  if (types.includes("night_club")) categories.add("musica");
  if (types.includes("restaurant") || types.includes("food")) categories.add("comida");
  if (types.includes("cafe")) categories.add("comida");
  if (types.includes("lodging")) categories.add("hospedaje");
  if (types.includes("tourist_attraction")) categories.add("tour");
  if (types.includes("museum")) categories.add("cultura");
  if (types.includes("natural_feature") || types.includes("park")) categories.add("naturaleza");
  if (types.includes("shopping_mall") || types.includes("market")) categories.add("compras");
  return [...categories];
}
