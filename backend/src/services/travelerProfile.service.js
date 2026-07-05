import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { TravelerProfile } from "../models/TravelerProfile.js";

const MAX_PROFILE_INTERESTS = 5;
const MAX_PROFILE_ZONES = 5;

export async function findTravelerProfile(phone) {
  if (!phone || mongoose.connection.readyState !== 1) return null;
  return TravelerProfile.findOne({ phone }).lean();
}

export function applyTravelerProfileDefaults(payload, profile, { reuseProfile = false } = {}) {
  if (!profile) return payload;

  return {
    ...payload,
    interests: pickArray(payload.interests, reuseProfile ? profile.preferredInterests : [], profile.preferredInterests),
    budgetUsd: pickValue(payload.budgetUsd, profile.typicalBudgetUsd),
    days: pickValue(payload.days, profile.typicalDays),
    travelers: pickValue(payload.travelers, profile.typicalTravelers),
    preferredZone: pickValue(payload.preferredZone, profile.preferredZones?.[0]),
  };
}

export async function upsertTravelerProfile(userContext) {
  if (mongoose.connection.readyState !== 1 || !userContext.phone || !["whatsapp", "telegram", "web"].includes(userContext.channel)) return null;

  const existing = await TravelerProfile.findOne({ phone: userContext.phone }).lean();
  const preferredInterests = mergeRecentValues(existing?.preferredInterests, userContext.interests, MAX_PROFILE_INTERESTS);
  const preferredZones = mergeRecentValues(existing?.preferredZones, [userContext.preferredZone], MAX_PROFILE_ZONES);

  return TravelerProfile.findOneAndUpdate(
    { phone: userContext.phone },
    {
      $set: {
        channel: userContext.channel,
        preferredInterests,
        typicalBudgetUsd: Number(userContext.budgetUsd) || existing?.typicalBudgetUsd,
        typicalTravelers: Number(userContext.travelers) || existing?.typicalTravelers,
        typicalDays: Number(userContext.days) || existing?.typicalDays,
        preferredZones,
        lastInteractionAt: new Date(),
      },
      $inc: { timesUsed: 1 },
    },
    { upsert: true, new: true }
  );
}

export async function deleteTravelerProfile(phone) {
  if (!phone || mongoose.connection.readyState !== 1) {
    return { deletedProfileCount: 0, deletedConversationCount: 0 };
  }

  const normalizedPhones = buildPhoneVariants(phone);
  const [profileResult, conversationResult] = await Promise.all([
    TravelerProfile.deleteMany({ phone: { $in: normalizedPhones } }),
    Conversation.deleteMany({ phone: { $in: normalizedPhones } }),
  ]);

  return {
    deletedProfileCount: profileResult.deletedCount || 0,
    deletedConversationCount: conversationResult.deletedCount || 0,
  };
}

export function isReuseLastTripMessage(message) {
  const normalized = normalizeText(message);
  return /\b(igual|mismo|misma)\s+que\s+la\s+(ultima|pasada|vez\s+pasada)\b/.test(normalized) || /\brepeti(?:r)?\s+(?:lo\s+)?(?:ultimo|anterior)\b/.test(normalized);
}

export function buildReturningTravelerReply(profile) {
  const interest = profile?.preferredInterests?.[0];
  const interestText = interest ? ` Vi que la ultima vez te gusto ${interest}.` : "";
  return `Hola de nuevo!${interestText} Contame que estas buscando esta vez, o decime "igual que la ultima vez" y confirmame la fecha.`;
}

function pickValue(primary, fallback) {
  if (primary !== undefined && primary !== null && primary !== "") return primary;
  return fallback ?? null;
}

function pickArray(primary, reuseValues, fallback) {
  if (Array.isArray(primary) && primary.length > 0) return primary;
  if (Array.isArray(reuseValues) && reuseValues.length > 0) return reuseValues;
  return Array.isArray(fallback) ? fallback : [];
}

function mergeRecentValues(existing = [], incoming = [], limit) {
  const values = [...(incoming || []), ...(existing || [])]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return [...new Set(values)].slice(0, limit);
}

function buildPhoneVariants(phone) {
  const value = String(phone);
  if (value.includes(":")) return [value];
  return [value, `telegram:${value}`, `whatsapp:${value}`, `web:${value}`];
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
