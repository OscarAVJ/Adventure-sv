import { itineraryMock } from "../mocks/itineraryMock";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function createItinerary(payload) {
  if (USE_MOCKS) {
    await wait(900);
    return {
      ...itineraryMock,
      budgetUsd: payload.budgetUsd,
    };
  }

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

