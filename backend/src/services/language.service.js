import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { normalizeText } from "./intent.service.js";

const SUPPORTED_LANGUAGES = ["es", "en"];

const ENGLISH_WORDS = [
  "i",
  "want",
  "need",
  "trip",
  "travel",
  "days",
  "day",
  "budget",
  "people",
  "person",
  "starting",
  "start",
  "from",
  "beach",
  "food",
  "nature",
  "culture",
  "hotel",
  "near",
  "today",
  "tomorrow",
];

const SPANISH_WORDS = [
  "quiero",
  "necesito",
  "viaje",
  "dias",
  "dia",
  "presupuesto",
  "personas",
  "somos",
  "desde",
  "playa",
  "comida",
  "naturaleza",
  "cultura",
  "hotel",
  "cerca",
  "hoy",
  "manana",
];

export async function resolveConversationLanguage({ phone, channel, message }) {
  const explicitLang = detectLanguage(message);
  const existingLang = await findConversationLanguage({ phone, channel });

  if (existingLang && explicitLang === "unknown") return existingLang;
  if (existingLang && explicitLang === existingLang) return existingLang;
  return explicitLang === "unknown" ? existingLang || "es" : explicitLang;
}

export function detectLanguage(text) {
  const normalized = normalizeText(text);
  if (!normalized) return "unknown";

  const englishScore = scoreLanguage(normalized, ENGLISH_WORDS);
  const spanishScore = scoreLanguage(normalized, SPANISH_WORDS);

  if (englishScore >= spanishScore + 2) return "en";
  if (spanishScore >= englishScore + 1) return "es";
  if (/\b(i|we|my|our|the|and|with|for|from)\b/.test(normalized)) return "en";
  return "es";
}

export function normalizeLanguage(lang) {
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : "es";
}

async function findConversationLanguage({ phone, channel }) {
  if (!phone || mongoose.connection.readyState !== 1) return null;
  const conversation = await Conversation.findOne({ phone, channel, status: "active" }).select("lang").lean();
  return conversation?.lang ? normalizeLanguage(conversation.lang) : null;
}

function scoreLanguage(text, words) {
  return words.reduce((score, word) => {
    const escapedWord = normalizeText(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return score + (new RegExp(`(^|[^a-z0-9])${escapedWord}($|[^a-z0-9])`).test(text) ? 1 : 0);
  }, 0);
}
