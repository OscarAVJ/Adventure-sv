const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function createItinerary(payload) {
  const response = await fetch(`${API_URL}/api/itineraries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "No se pudo generar el itinerario.");
  }

  return data.itinerary;
}

export async function rerollActivity(itineraryId, activityId, reason = "disliked") {
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
    throw new Error(isNoAlternative ? "No encontramos otra opcion cercana en esta categoria." : data.message || "No se pudo cambiar la actividad.");
  }

  return data.day;
}

