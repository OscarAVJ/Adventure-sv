import { useState } from "react";
import { createItinerary } from "../services/itineraryApi";

export function useItinerary() {
  const [itinerary, setItinerary] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

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

  return {
    itinerary,
    status,
    error,
    generateItinerary,
  };
}

