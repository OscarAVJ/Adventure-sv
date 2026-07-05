import { parseWhatsappTripRequestWithAi } from "./ai.service.js";
import { extractInterests } from "./intent.service.js";
import { generateItinerary } from "./itinerary.service.js";

const REQUIRED_FIELDS = [
  { key: "budgetUsd", label: "presupuesto aproximado en dolares" },
  { key: "days", label: "cantidad de dias" },
  { key: "startDate", label: "fecha de inicio" },
  { key: "travelers", label: "cantidad de viajeros" },
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

  if (!message) {
    return buildNeedsInputResponse({
      phone,
      missingFields: ["mensaje del viajero"],
      replyText: "Contame que tipo de viaje queres hacer, fecha, dias, viajeros y presupuesto aproximado.",
    });
  }

  const aiFields = await parseWhatsappTripRequestWithAi({ message, currentDate });
  const requestPayload = buildItineraryPayload({ body, aiFields, message, phone, channel });
  const missingFields = getMissingFields(requestPayload);

  if (missingFields.length > 0) {
    return buildNeedsInputResponse({
      phone,
      missingFields,
      replyText: buildMissingInfoReply(missingFields),
    });
  }

  return generateItinerary(requestPayload);
}

function buildItineraryPayload({ body, aiFields, message, phone, channel }) {
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

function getMissingFields(payload) {
  return REQUIRED_FIELDS.filter(({ key }) => payload[key] === undefined || payload[key] === null || payload[key] === "").map(
    ({ label }) => label
  );
}

function buildMissingInfoReply(missingFields) {
  return [
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

function pickValue(primary, secondary) {
  if (primary !== undefined && primary !== null && primary !== "") return primary;
  return secondary ?? null;
}

function pickArray(...values) {
  const selected = values.find((value) => Array.isArray(value) && value.length > 0);
  return selected || [];
}
