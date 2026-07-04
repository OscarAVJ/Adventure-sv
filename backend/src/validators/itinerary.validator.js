import { AppError } from "../utils/AppError.js";

export function validateItineraryRequest(body) {
  const details = [];

  if (!["web", "whatsapp"].includes(body.channel)) {
    details.push("channel debe ser web o whatsapp");
  }

  if (body.budgetUsd === undefined || body.budgetUsd === null || body.budgetUsd === "") {
    details.push("budgetUsd es requerido");
  } else if (Number(body.budgetUsd) <= 0) {
    details.push("budgetUsd debe ser mayor que 0");
  }

  if (body.days === undefined || body.days === null || body.days === "") {
    details.push("days es requerido");
  } else if (Number(body.days) < 1 || Number(body.days) > 10) {
    details.push("days debe estar entre 1 y 10");
  }

  if (!body.startDate) {
    details.push("startDate es requerido");
  } else if (!isValidDate(body.startDate)) {
    details.push("startDate debe ser una fecha valida en formato YYYY-MM-DD");
  }

  if (body.travelers !== undefined && body.travelers !== null && Number(body.travelers) <= 0) {
    details.push("travelers debe ser mayor que 0");
  }

  if (!body.message && (!Array.isArray(body.interests) || body.interests.length === 0)) {
    details.push("message es requerido si no vienen interests");
  }

  if (details.length > 0) {
    throw new AppError("No se pudo generar el itinerario.", 400, details);
  }
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
