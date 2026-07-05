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
