import { useState } from "react";
import { createItinerary, getItineraryStatus, rerollActivity } from "../services/itineraryApi";

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 80;

export function useItinerary() {
  const [itinerary, setItinerary] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [rerollingActivityId, setRerollingActivityId] = useState(null);
  const [rerollError, setRerollError] = useState(null);

  async function generateItinerary(payload) {
    try {
      setStatus("loading");
      setError(null);

      const result = await createItinerary(payload);
      const itineraryResult = result?.status === "processing" ? await pollItinerary(result.itineraryId) : result;

      setItinerary(itineraryResult);
      setStatus("success");
    } catch (err) {
      setError(err.message || "No se pudo generar el itinerario.");
      setStatus("error");
    }
  }

  async function pollItinerary(itineraryId) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      await wait(POLL_INTERVAL_MS);
      const statusResponse = await getItineraryStatus(itineraryId);

      if (statusResponse.status === "ready") {
        return statusResponse.itinerary;
      }
    }

    throw new Error("El itinerario está tardando más de lo esperado. Intenta consultar de nuevo en unos segundos.");
  }

  async function changeActivity(activityId, reason = "disliked") {
    if (!itinerary?.id || !activityId) return;

    try {
      setRerollingActivityId(activityId);
      setRerollError(null);

      const updatedDay = await rerollActivity(itinerary.id, activityId, reason);

      setItinerary((current) => {
        if (!current) return current;

        const previousDay = current.days.find((day) => day.day === updatedDay.day);
        const previousDayCost = Number(previousDay?.costUsd || 0);
        const nextDayCost = Number(updatedDay.costUsd || 0);

        return {
          ...current,
          estimatedCostUsd: Number(current.estimatedCostUsd || 0) - previousDayCost + nextDayCost,
          days: current.days.map((day) => (day.day === updatedDay.day ? updatedDay : day)),
        };
      });
    } catch (err) {
      setRerollError({
        activityId,
        message: err.message || "No se pudo cambiar la actividad.",
      });
    } finally {
      setRerollingActivityId(null);
    }
  }

  return {
    itinerary,
    status,
    error,
    rerollingActivityId,
    rerollError,
    generateItinerary,
    changeActivity,
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

