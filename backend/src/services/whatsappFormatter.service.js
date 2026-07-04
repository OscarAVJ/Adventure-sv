export function formatReplyText({ itinerary, occasionRule, season }) {
  const occasionText = occasionRule ? ` para ${occasionRule.label.toLowerCase()}` : "";
  const seasonText = season ? ` en temporada de ${season.label.toLowerCase()}` : "";
  return `Te arme un itinerario de ${itinerary.days.length} dias${occasionText}${seasonText}. Costo estimado: $${itinerary.estimatedCostUsd} de $${itinerary.budgetUsd}.`;
}
