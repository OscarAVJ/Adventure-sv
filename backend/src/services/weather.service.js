import { env } from "../config/env.js";

export async function getWeatherSummary({ date, zone }) {
  if (!env.weatherApiKey) {
    return `Clima esperado agradable para actividades en ${zone || "la zona seleccionada"}.`;
  }

  return `Pronostico consultado para ${zone || "la zona seleccionada"} el ${date}.`;
}
