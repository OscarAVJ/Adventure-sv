import mongoose from "mongoose";
import { Itinerary } from "../models/Itinerary.js";
import { formatDailySummary, formatDayUpdate } from "./whatsappFormatter.service.js";
import { getWeatherForecast } from "./weather.service.js";
import { rerollItineraryActivity } from "./itinerary.service.js";
import { sendTelegramMessage } from "./telegram.service.js";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const DAILY_SEND_HOUR = 6;
const RAIN_SENSITIVE_TYPES = new Set(["playa", "naturaleza", "aventura"]);

let schedulerStarted = false;

export function startTripModeScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  runDailyTripNotifications().catch((error) => {
    console.error("Daily trip notification run failed", error);
  });

  setInterval(() => {
    runDailyTripNotifications().catch((error) => {
      console.error("Daily trip notification run failed", error);
    });
  }, CHECK_INTERVAL_MS);
}

export async function runDailyTripNotifications() {
  if (mongoose.connection.readyState !== 1) return;
  if (!shouldRunDailyNotificationWindow()) return;

  const today = getTodayInElSalvador();
  const itineraries = await Itinerary.find({
    channel: "telegram",
    status: "ready",
    "days.date": today,
  });

  for (const itinerary of itineraries) {
    const dayIndex = (itinerary.days || []).findIndex((day) => day.date === today && day.notificationSent !== true);
    if (dayIndex < 0) continue;

    const day = itinerary.days[dayIndex];
    const firstCoordinates = day.activities?.find((activity) => activity.coordinates)?.coordinates;
    const weather = await getWeatherForecast({ date: day.date, zone: day.zone, coordinates: firstCoordinates });
    const replyMarkup = weather.willRain
      ? {
          inline_keyboard: [
            [
              {
                text: itinerary.lang === "en" ? "Change plan for rain" : "Cambiar plan por lluvia",
                callback_data: `reroll_day:${itinerary._id}:${day.day}`,
              },
            ],
          ],
        }
      : null;

    const sent = await sendTelegramMessage({
      phone: itinerary.phone,
      text: formatDailySummary({ day, weather, lang: itinerary.lang || "es" }),
      replyMarkup,
    });

    if (sent) {
      itinerary.days[dayIndex] = {
        ...day,
        notificationSent: true,
        notificationSentAt: new Date(),
      };
      itinerary.markModified("days");
      await itinerary.save();
    }
  }
}

export async function handleTelegramCallback(body) {
  const callback = body.callback_query || body.callbackQuery || body;
  const data = callback.data || body.data || "";
  const chatId = callback.message?.chat?.id || body.chatId || body.message?.chat?.id;

  if (!data.startsWith("reroll_day:")) {
    return { success: true, ignored: true };
  }

  const [, itineraryId, dayNumberValue] = data.split(":");
  const dayNumber = Number(dayNumberValue);
  const itinerary = await Itinerary.findById(itineraryId).lean();
  if (!itinerary) {
    return { success: false, message: "Itinerario no encontrado." };
  }

  const day = (itinerary.days || []).find((item) => Number(item.day) === dayNumber);
  if (!day) {
    return { success: false, message: "Dia no encontrado." };
  }

  let updatedDay = day;
  const sensitiveActivities = (day.activities || []).filter((activity) => RAIN_SENSITIVE_TYPES.has(activity.type));

  for (const activity of sensitiveActivities) {
    try {
      const result = await rerollItineraryActivity({ itineraryId, activityId: activity.id, reason: "rain" });
      updatedDay = result.day;
    } catch (error) {
      console.warn("Rain reroll activity failed", error.message);
    }
  }

  const phone = itinerary.phone || (chatId ? `telegram:${chatId}` : null);
  const text =
    sensitiveActivities.length > 0
      ? formatDayUpdate({ day: updatedDay, lang: itinerary.lang || "es" })
      : itinerary.lang === "en"
        ? "I did not find outdoor activities that need a rain replacement for this day."
        : "No encontre actividades al aire libre que necesiten cambio por lluvia para este dia.";

  await sendTelegramMessage({ phone, text });

  return {
    success: true,
    day: updatedDay,
  };
}

function shouldRunDailyNotificationWindow() {
  const now = new Date();
  const localHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/El_Salvador",
      hour: "2-digit",
      hour12: false,
    }).format(now)
  );

  return localHour >= DAILY_SEND_HOUR;
}

function getTodayInElSalvador() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
