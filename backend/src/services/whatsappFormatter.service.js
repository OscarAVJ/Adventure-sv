export function formatReplyText({ itinerary, occasionRule, season }) {
  const occasionText = occasionRule ? ` para ${occasionRule.label.toLowerCase()}` : "";
  const seasonText = season ? ` en temporada de ${season.label.toLowerCase()}` : "";
  const header = `Te arme un itinerario de ${itinerary.days.length} dias${occasionText}${seasonText}.`;
  const budget = `Costo estimado: $${itinerary.estimatedCostUsd} de $${itinerary.budgetUsd}.`;
  const days = itinerary.days
    .map((day) => {
      const activities = day.activities
        .map(formatActivity)
        .join("\n");
      const spending = (day.spendingOptions || [])
        .map((option) => `  * ${option.category}: $${option.costUsd}`)
        .join("\n");
      const alternatives = (day.alternatives || [])
        .slice(0, 2)
        .map((option) => `  * ${option.name} (${option.zone})`)
        .join("\n");
      const spendingBlock = spending ? `\nGastos sugeridos:\n${spending}` : "";
      const alternativesBlock = alternatives ? `\nOpciones alternativas:\n${alternatives}` : "";
      return `Dia ${day.day} (${day.date}) - ${day.zone}\n${activities}${spendingBlock}${alternativesBlock}`;
    })
    .join("\n\n");

  return [header, budget, days].filter(Boolean).join("\n\n");
}

function formatActivity(activity) {
  const status = formatOpenStatus(activity);
  const cost = formatActivityCost(activity);
  const location = activity.googleMapsUrl ? `\n  Ubicacion: ${activity.googleMapsUrl}` : "";
  const address = activity.address ? `\n  Direccion: ${activity.address}` : "";
  const hours = formatOpeningHours(activity.openingHours);
  const breakdown = formatSpendingBreakdown(activity.spendingBreakdown);

  return [
    `- ${activity.time} ${activity.name}: ${activity.notes}`,
    cost ? `  Costo estimado: ${cost}` : null,
    breakdown || null,
    status ? `  Estado: ${status}` : null,
    location || null,
    address || null,
    hours ? `  Horarios: ${hours}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatActivityCost(activity) {
  const value = activity.estimatedTotalCostUsd ?? activity.costUsd;
  return Number.isFinite(Number(value)) ? `$${value}` : "";
}

function formatSpendingBreakdown(spendingBreakdown) {
  if (!Array.isArray(spendingBreakdown) || spendingBreakdown.length === 0) return "";
  return spendingBreakdown.map((item) => `  - ${item.category}: $${item.costUsd}`).join("\n");
}

function formatOpenStatus(activity) {
  if (activity.openNow === true) return "Abierto ahora";
  if (activity.openNow === false) return "Cerrado ahora";
  return "Horario no disponible";
}

function formatOpeningHours(openingHours) {
  if (!Array.isArray(openingHours) || openingHours.length === 0) return "";
  return openingHours.slice(0, 7).join(" | ");
}
