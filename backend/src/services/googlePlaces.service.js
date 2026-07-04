import { env } from "../config/env.js";
import { normalizeText } from "./intent.service.js";

const FALLBACK_PLACES = [
  {
    name: "Playa El Tunco",
    type: "playa",
    categories: ["playa", "surf"],
    zone: "El Tunco",
    googlePlaceId: "fallback-playa-el-tunco",
    rating: 4.6,
    coordinates: { lat: 13.4938, lng: -89.3838 },
    openNow: true,
  },
  {
    name: "Clase de surf en El Tunco",
    type: "surf",
    categories: ["surf", "playa", "tour"],
    zone: "El Tunco",
    googlePlaceId: "fallback-surf-el-tunco",
    rating: 4.7,
    coordinates: { lat: 13.4932, lng: -89.3842 },
    openNow: true,
  },
  {
    name: "Restaurante de comida local en La Libertad",
    type: "comida",
    categories: ["comida", "familia"],
    zone: "La Libertad",
    googlePlaceId: "fallback-comida-la-libertad",
    rating: 4.4,
    coordinates: { lat: 13.487, lng: -89.322 },
    openNow: true,
  },
  {
    name: "Cena al atardecer en El Tunco",
    type: "romantico",
    categories: ["romantico", "comida", "playa"],
    zone: "El Tunco",
    googlePlaceId: "fallback-cena-atardecer-tunco",
    rating: 4.5,
    coordinates: { lat: 13.494, lng: -89.383 },
    openNow: true,
  },
  {
    name: "Centro historico de Suchitoto",
    type: "cultura",
    categories: ["cultura", "tour"],
    zone: "Suchitoto",
    googlePlaceId: "fallback-suchitoto-centro",
    rating: 4.6,
    coordinates: { lat: 13.9381, lng: -89.0278 },
    openNow: true,
  },
  {
    name: "Lago de Coatepeque",
    type: "naturaleza",
    categories: ["naturaleza", "familia", "comida"],
    zone: "Lago de Coatepeque",
    googlePlaceId: "fallback-lago-coatepeque",
    rating: 4.7,
    coordinates: { lat: 13.8642, lng: -89.545 },
    openNow: true,
  },
  {
    name: "Ruta de Las Flores",
    type: "tour",
    categories: ["tour", "naturaleza", "cultura", "comida"],
    zone: "Ruta de Las Flores",
    googlePlaceId: "fallback-ruta-flores",
    rating: 4.8,
    coordinates: { lat: 13.8691, lng: -89.8492 },
    openNow: true,
  },
  {
    name: "Hospedaje boutique en El Tunco",
    type: "hospedaje",
    categories: ["hospedaje", "romantico", "playa"],
    zone: "El Tunco",
    googlePlaceId: "fallback-hospedaje-tunco",
    rating: 4.3,
    coordinates: { lat: 13.4928, lng: -89.3831 },
    openNow: true,
  },
];

export async function searchCandidatePlaces(userContext) {
  if (!env.googleMapsApiKey) {
    return searchFallbackPlaces(userContext);
  }

  const query = buildPlacesQuery(userContext);
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", env.googleMapsApiKey);
  url.searchParams.set("language", "es");

  const response = await fetch(url);
  if (!response.ok) {
    return searchFallbackPlaces(userContext);
  }

  const data = await response.json();
  const places = (data.results || []).map((place) => mapGooglePlace(place, userContext));
  return places.length > 0 ? places : searchFallbackPlaces(userContext);
}

function searchFallbackPlaces(userContext) {
  const zone = normalizeText(userContext.preferredZone);
  const matching = FALLBACK_PLACES.filter((place) => {
    const hasInterest = place.categories.some((category) => userContext.interests.includes(category));
    const sameZone = !zone || normalizeText(place.zone) === zone;
    return hasInterest || sameZone;
  });

  return matching.length > 0 ? matching : FALLBACK_PLACES;
}

function buildPlacesQuery(userContext) {
  const interests = userContext.interests.join(" ");
  const zone = userContext.preferredZone || "El Salvador";
  return `${interests} turismo ${zone} El Salvador`;
}

function mapGooglePlace(place, userContext) {
  const inferredType = userContext.interests[0] || "tour";
  return {
    name: place.name,
    type: inferredType,
    categories: inferCategoriesFromGooglePlace(place, userContext),
    zone: userContext.preferredZone || place.formatted_address || "El Salvador",
    googlePlaceId: place.place_id,
    rating: place.rating || 0,
    coordinates: {
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
    },
    openNow: place.opening_hours?.open_now,
  };
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
