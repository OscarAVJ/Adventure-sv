import { Conversation } from "../models/Conversation.js";
import { parseWhatsappTripRequestWithAi } from "./ai.service.js";
import { startAsyncItineraryGeneration } from "./asyncItinerary.service.js";
import { extractInterests } from "./intent.service.js";
import { resolveConversationLanguage } from "./language.service.js";
import { generateItinerary } from "./itinerary.service.js";
import {
  applyTravelerProfileDefaults,
  buildReturningTravelerReply,
  findTravelerProfile,
  isReuseLastTripMessage,
} from "./travelerProfile.service.js";

const REQUIRED_FIELDS = [
  { key: "budgetUsd", labels: { es: "presupuesto aproximado en dolares", en: "approximate budget in dollars" } },
  { key: "days", labels: { es: "cantidad de dias", en: "number of days" } },
  { key: "startDate", labels: { es: "fecha de inicio", en: "start date" } },
  { key: "travelers", labels: { es: "cantidad de viajeros", en: "number of travelers" } },
];

export async function handleN8nWhatsappMessage(body) {
  return handleN8nChatMessage(body, { channel: "whatsapp" });
}

export async function handleN8nTelegramMessage(body) {
  return handleN8nChatMessage(body, { channel: "telegram" });
}

export async function handleN8nChatMessage(body, { channel = body.channel || "whatsapp" } = {}) {
  const message = extractChatMessage(body);
  const phone = extractChatIdentifier(body, channel);
  const currentDate = new Date().toISOString().slice(0, 10);
  const lang = await resolveConversationLanguage({ phone, channel, message });

  if (!message) {
    const response = buildNeedsInputResponse({
      phone,
      missingFields: ["mensaje del viajero"],
      replyText:
        lang === "en"
          ? "Tell me what kind of trip you want, plus date, days, travelers, and approximate budget."
          : "Contame que tipo de viaje queres hacer, fecha, dias, viajeros y presupuesto aproximado.",
    });
    await saveNeedsInputTurn({ phone, channel, lang, message, replyText: response.replyText });
    return response;
  }

  const aiFields = await parseWhatsappTripRequestWithAi({ message, currentDate });
  const profile = await findTravelerProfile(phone);
  const reuseProfile = isReuseLastTripMessage(message);
  const requestPayload = applyTravelerProfileDefaults(buildItineraryPayload({ body, aiFields, message, phone, channel, lang }), profile, {
    reuseProfile,
  });
  const missingFields = getMissingFields(requestPayload, lang);

  if (missingFields.length > 0) {
    const response = buildNeedsInputResponse({
      phone,
      missingFields,
      replyText: buildMissingInfoReply(missingFields, profile, lang),
    });
    await saveNeedsInputTurn({ phone, channel, lang, message, replyText: response.replyText });
    return response;
  }

  if (channel !== "telegram") {
    return generateItinerary(requestPayload);
  }

  const asyncResponse = await startAsyncItineraryGeneration(requestPayload, { notifyTelegram: true });
  if (asyncResponse.mode === "sync") return asyncResponse;

  return {
    ...asyncResponse,
    replyText:
      lang === "en"
        ? "Give me a moment, I am building your itinerary with real places. I will send it here when it is ready."
        : "Dame un momento, estoy armando tu itinerario con lugares reales. Te lo envio aqui cuando este listo.",
    itinerary: null,
  };
}

function buildItineraryPayload({ body, aiFields, message, phone, channel, lang }) {
  const fallbackInterests = extractInterests(message);

  return {
    channel,
    message,
    interests: pickArray(body.interests, aiFields.interests, fallbackInterests),
    budgetUsd: pickValue(body.budgetUsd, aiFields.budgetUsd),
    days: pickValue(body.days, aiFields.days),
    startDate: pickValue(body.startDate, aiFields.startDate),
    preferredZone: pickValue(body.preferredZone, aiFields.preferredZone),
    occasion: pickValue(body.occasion, aiFields.occasion),
    travelers: pickValue(body.travelers, aiFields.travelers),
    conversationId: body.conversationId || null,
    phone,
    lang,
  };
}

function extractChatMessage(body) {
  const message =
    body.message?.text ||
    body.body?.message?.text ||
    body.text ||
    body.chatInput ||
    (typeof body.message === "string" ? body.message : null) ||
    (typeof body.body?.message === "string" ? body.body.message : null) ||
    body.body?.text ||
    body.body?.chatInput ||
    body.messages?.[0]?.text?.body ||
    body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
    "";

  return message.trim();
}

function extractChatIdentifier(body, channel) {
  const identifier =
    body.phone ||
    body.chatId ||
    body.message?.chat?.id ||
    body.from ||
    body.body?.phone ||
    body.body?.chatId ||
    body.messages?.[0]?.from ||
    body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
    null;

  if (!identifier) return null;
  return String(identifier).startsWith(`${channel}:`) ? String(identifier) : `${channel}:${identifier}`;
}

function getMissingFields(payload, lang = "es") {
  return REQUIRED_FIELDS.filter(({ key }) => payload[key] === undefined || payload[key] === null || payload[key] === "").map(
    ({ labels }) => labels[lang] || labels.es
  );
}

function buildMissingInfoReply(missingFields, profile = null, lang = "es") {
  const returningIntro = profile ? [buildReturningTravelerReply(profile, lang), ""] : [];
  if (lang === "en") {
    return [
      ...returningIntro,
      "To build a real route, I still need:",
      ...missingFields.map((field) => `- ${field}`),
      "Example: I want 3 days starting 2026-07-24, we are 4 people, budget $600, we like culture and nature.",
    ].join("\n");
  }

  return [
    ...returningIntro,
    "Para armarte una ruta real necesito estos datos:",
    ...missingFields.map((field) => `- ${field}`),
    "Ejemplo: Quiero 3 dias desde 2026-07-24, somos 4 personas, presupuesto $600, nos gusta cultura y naturaleza.",
  ].join("\n");
}

function buildNeedsInputResponse({ phone, missingFields, replyText }) {
  return {
    success: true,
    status: "needs_input",
    phone,
    missingFields,
    replyText,
    itinerary: null,
  };
}

async function saveNeedsInputTurn({ phone, channel, lang, message, replyText }) {
  if (!phone || Conversation.db.readyState !== 1 || !["whatsapp", "telegram"].includes(channel)) return;

  await Conversation.findOneAndUpdate(
    { phone, channel, status: "active" },
    {
      $setOnInsert: { channel, phone, status: "active" },
      $set: { lang },
      $push: {
        messages: [
          message ? { role: "user", content: message } : null,
          { role: "assistant", content: replyText },
        ].filter(Boolean),
      },
    },
    { upsert: true, new: true }
  );
}

function pickValue(primary, secondary) {
  if (primary !== undefined && primary !== null && primary !== "") return primary;
  return secondary ?? null;
}

function pickArray(...values) {
  const selected = values.find((value) => Array.isArray(value) && value.length > 0);
  return selected || [];
}
