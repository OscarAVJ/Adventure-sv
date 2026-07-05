const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function createItinerary(payload, messages = {}) {
  const response = await fetch(`${API_URL}/api/itineraries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (response.status === 202 || data.status === "processing") {
    return {
      status: "processing",
      itineraryId: data.itineraryId,
    };
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || messages.generation || "No se pudo generar el itinerario.");
  }

  return data.itinerary;
}

export async function getItineraryStatus(itineraryId, messages = {}) {
  const response = await fetch(`${API_URL}/api/itineraries/${itineraryId}/status`);
  const data = await response.json();

  if (!response.ok || data.status === "error") {
    throw new Error(data.error || data.message || messages.generation || "No se pudo generar el itinerario.");
  }

  return data;
}

export async function rerollActivity(itineraryId, activityId, reason = "disliked", messages = {}) {
  const response = await fetch(`${API_URL}/api/itineraries/${itineraryId}/activities/${activityId}/reroll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const isNoAlternative = response.status === 409 || data.message === "no_alternative_available";
    throw new Error(isNoAlternative ? messages.noAlternative || "No encontramos otra opción cercana en esta categoría." : data.message || messages.reroll || "No se pudo cambiar la actividad.");
  }

  return data.day;
}

