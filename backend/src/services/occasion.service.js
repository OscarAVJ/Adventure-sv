import { OccasionRule } from "../models/OccasionRule.js";

const FALLBACK_OCCASIONS = {
  birthday: {
    key: "birthday",
    label: "Cumpleanos",
    tags: ["celebracion", "grupo"],
    preferredCategories: ["comida", "tour"],
    avoidedCategories: [],
    tone: "adventure",
    zoneBoosts: [],
    placeBoosts: [],
    active: true,
  },
  anniversary: {
    key: "anniversary",
    label: "Aniversario",
    tags: ["atardecer", "cena tranquila"],
    preferredCategories: ["romantico", "comida", "playa"],
    avoidedCategories: [],
    tone: "romantic",
    zoneBoosts: [{ zone: "El Tunco", weight: 8 }],
    placeBoosts: [],
    active: true,
  },
  family: {
    key: "family",
    label: "Viaje familiar",
    tags: ["seguro", "comodo"],
    preferredCategories: ["familia", "naturaleza", "comida"],
    avoidedCategories: ["romantico"],
    tone: "family",
    zoneBoosts: [],
    placeBoosts: [],
    active: true,
  },
  friends: {
    key: "friends",
    label: "Viaje con amigos",
    tags: ["grupo", "actividad"],
    preferredCategories: ["surf", "playa", "tour", "comida"],
    avoidedCategories: [],
    tone: "adventure",
    zoneBoosts: [],
    placeBoosts: [],
    active: true,
  },
  romantic: {
    key: "romantic",
    label: "Viaje romantico",
    tags: ["atardecer", "tranquilo"],
    preferredCategories: ["romantico", "comida", "playa"],
    avoidedCategories: ["familia"],
    tone: "romantic",
    zoneBoosts: [],
    placeBoosts: [],
    active: true,
  },
  adventure: {
    key: "adventure",
    label: "Aventura",
    tags: ["activo", "explorar"],
    preferredCategories: ["naturaleza", "surf", "tour"],
    avoidedCategories: [],
    tone: "adventure",
    zoneBoosts: [],
    placeBoosts: [],
    active: true,
  },
  rest: {
    key: "rest",
    label: "Descanso",
    tags: ["tranquilo", "pausado"],
    preferredCategories: ["naturaleza", "playa", "hospedaje"],
    avoidedCategories: [],
    tone: "relaxed",
    zoneBoosts: [],
    placeBoosts: [],
    active: true,
  },
};

export async function findOccasionRule(occasionKey) {
  if (!occasionKey) return null;

  if (OccasionRule.db.readyState === 1) {
    const rule = await OccasionRule.findOne({ key: occasionKey, active: true }).lean();
    if (rule) return rule;
  }

  return FALLBACK_OCCASIONS[occasionKey] || null;
}
