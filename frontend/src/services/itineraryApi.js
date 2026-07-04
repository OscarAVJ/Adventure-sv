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

