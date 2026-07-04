export function formatReplyText({ itinerary, occasionRule, season }) {
  const occasionText = occasionRule ? ` para ${occasionRule.label.toLowerCase()}` : "";
  const seasonText = season ? ` en temporada de ${season.label.toLowerCase()}` : "";
  const header = `Te arme un itinerario de ${itinerary.days.length} dias${occasionText}${seasonText}.`;
  const budget = `Costo estimado: $${itinerary.estimatedCostUsd} de $${itinerary.budgetUsd}.`;
  const days = itinerary.days
    .map((day) => {
      const activities = day.activities
        .map((activity) => `- ${activity.time} ${activity.name}: ${activity.notes}`)
        .join("\n");
      return `Dia ${day.day} (${day.date}) - ${day.zone}\n${activities}`;
    })
    .join("\n\n");

  return [header, budget, days].filter(Boolean).join("\n\n");
}
