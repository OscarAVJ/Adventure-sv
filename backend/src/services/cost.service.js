const BASE_COSTS = {
  playa: 0,
  surf: 35,
  cultura: 10,
  naturaleza: 12,
  hospedaje: 70,
  comida: 18,
  tour: 35,
  romantico: 45,
  familia: 20,
};

export function estimateActivityCost(place, travelers) {
  const type = place.type || place.categories?.[0] || "tour";
  const perPerson = BASE_COSTS[type] ?? 20;
  return Math.round(perPerson * Math.max(travelers, 1));
}

export function fitActivitiesToBudget(days, budgetUsd) {
  const flattened = days.flatMap((day) => day.activities);
  let estimatedCostUsd = flattened.reduce((sum, activity) => sum + activity.costUsd, 0);

  if (estimatedCostUsd <= budgetUsd) {
    return { days: refreshDayCosts(days), estimatedCostUsd, adjustment: null };
  }

  const paidActivities = flattened.filter((activity) => activity.costUsd > 0);
  const scale = budgetUsd / estimatedCostUsd;

  for (const activity of paidActivities) {
    activity.costUsd = Math.max(0, Math.floor(activity.costUsd * scale));
    activity.badges = [...new Set([...(activity.badges || []), "Ajustado al presupuesto"])];
    activity.notes = `${activity.notes} Se sugirio una opcion mas economica.`;
  }

  estimatedCostUsd = flattened.reduce((sum, item) => sum + item.costUsd, 0);

  return {
    days: refreshDayCosts(days),
    estimatedCostUsd,
    adjustment: "Se ajustaron costos estimados para mantenerse dentro del presupuesto.",
  };
}

function refreshDayCosts(days) {
  return days.map((day) => ({
    ...day,
    costUsd: day.activities.reduce((sum, activity) => sum + activity.costUsd, 0),
  }));
}
