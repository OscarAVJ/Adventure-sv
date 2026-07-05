import mongoose from "mongoose";
import { Itinerary } from "../models/Itinerary.js";
import { AppError } from "../utils/AppError.js";
import { completeExistingItinerary, generateItinerary } from "./itinerary.service.js";
import { sendTelegramMessage } from "./telegram.service.js";

export async function startAsyncItineraryGeneration(input, { notifyTelegram = false } = {}) {
  if (mongoose.connection.readyState !== 1) {
    const response = await generateItinerary(input);
    return {
      mode: "sync",
      ...response,
    };
  }

  const processingItinerary = await Itinerary.create({
    channel: input.channel,
    phone: input.phone,
    lang: input.lang || "es",
    request: input,
    status: "processing",
    budgetUsd: Number(input.budgetUsd || 0),
    days: [],
  });

  queueInProcessJob({ itineraryId: processingItinerary._id.toString(), input, notifyTelegram });

  return {
    mode: "async",
    success: true,
    status: "processing",
    itineraryId: processingItinerary._id.toString(),
  };
}

export async function getItineraryStatus(itineraryId) {
  if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
    throw new AppError("Itinerario no valido.", 400);
  }

  const itinerary = await Itinerary.findById(itineraryId).lean();
  if (!itinerary) {
    throw new AppError("Itinerario no encontrado.", 404);
  }

  if (itinerary.status === "ready") {
    return {
      success: true,
      status: "ready",
      itinerary: {
        id: itinerary._id.toString(),
        lang: itinerary.lang,
        summary: itinerary.summary,
        context: itinerary.context,
        budgetUsd: itinerary.budgetUsd,
        estimatedCostUsd: itinerary.estimatedCostUsd,
        adjustments: itinerary.adjustments || [],
        days: itinerary.days || [],
      },
    };
  }

  if (itinerary.status === "error") {
    return {
      success: false,
      status: "error",
      error: itinerary.errorMessage || "No se pudo generar el itinerario.",
    };
  }

  return {
    success: true,
    status: "processing",
    itineraryId: itinerary._id.toString(),
  };
}

function queueInProcessJob({ itineraryId, input, notifyTelegram }) {
  // MVP async queue: runs in this Node process after the HTTP response is sent.
  // Limitation: if the process restarts mid-job, this job is not persisted like a Redis/BullMQ queue.
  setImmediate(async () => {
    try {
      const result = await completeExistingItinerary({ itineraryId, input });
      if (notifyTelegram && input.channel === "telegram") {
        await sendTelegramMessage({ phone: input.phone, text: result.replyText });
      }
    } catch (error) {
      console.error("Async itinerary generation failed", error);
      await Itinerary.findByIdAndUpdate(itineraryId, {
        $set: {
          status: "error",
          errorMessage: error.message || "No se pudo generar el itinerario.",
        },
      });

      if (notifyTelegram && input.channel === "telegram") {
        const text =
          input.lang === "en"
            ? "Sorry, I could not finish your itinerary. Please try again with a bit more detail."
            : "No pude terminar tu itinerario. Proba de nuevo con un poco mas de detalle.";
        await sendTelegramMessage({ phone: input.phone, text });
      }
    }
  });
}
