import { useState } from "react";
import { createItinerary, rerollActivity } from "../services/itineraryApi";

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

      setItinerary(result);
      setStatus("success");
    } catch (err) {
      setError(err.message || "No se pudo generar el itinerario.");
      setStatus("error");
    }
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

