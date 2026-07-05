const BASE_ACTIVITY_COSTS = {
  playa: { perPerson: 0, group: 4, label: "Acceso o consumo minimo" },
  surf: { perPerson: 35, group: 0, label: "Clase o alquiler de tabla" },
  cultura: { perPerson: 6, group: 0, label: "Entrada cultural" },
  naturaleza: { perPerson: 7, group: 3, label: "Entrada o fee natural" },
  hospedaje: { perPerson: 0, group: 65, label: "Hospedaje economico por noche" },
  comida: { perPerson: 12, group: 0, label: "Comida por persona" },
  tour: { perPerson: 22, group: 0, label: "Tour o actividad guiada" },
  romantico: { perPerson: 22, group: 0, label: "Cena o experiencia especial" },
  familia: { perPerson: 10, group: 0, label: "Actividad familiar" },
  aventura: { perPerson: 30, group: 0, label: "Actividad de aventura" },
  vida_nocturna: { perPerson: 18, group: 0, label: "Consumo nocturno" },
  bebidas: { perPerson: 12, group: 0, label: "Bebidas o consumo minimo" },
  musica: { perPerson: 15, group: 0, label: "Entrada o consumo musical" },
  compras: { perPerson: 15, group: 0, label: "Compra sugerida" },
  bienestar: { perPerson: 35, group: 0, label: "Spa o bienestar" },
};

const PREMIUM_ZONE_PATTERN = /\b(san benito|escalon|santa elena|multiplaza|bambu|el tunco|el zonte|surf city|costa del sol)\b/i;
const BUDGET_PLACE_PATTERN = /\b(parque|mercado|mirador|playa|malecon|centro historico)\b/i;

export function estimateActivityCost(place, travelers) {
  const pricing = getActivityPricing(place);
  const travelerCount = getTravelerCount(travelers);
  const multiplier = getPriceMultiplier(place);
  return roundUsd((pricing.perPerson * travelerCount + pricing.group) * multiplier);
}

export function fitActivitiesToBudget(days, budgetUsd, userContext = {}) {
  const daysWithSpending = refreshDayCosts(addSpendingOptions(days, userContext));
  let estimatedCostUsd = calculateItineraryCost(daysWithSpending);

  if (estimatedCostUsd <= budgetUsd) {
    return { days: refreshDayCosts(daysWithSpending), estimatedCostUsd, adjustment: null };
  }

  const paidActivities = daysWithSpending.flatMap((day) => day.activities).filter((activity) => getActivityDisplayCost(activity) > 0);
  const scale = Math.max(0.55, budgetUsd / estimatedCostUsd);

  for (const activity of paidActivities) {
    activity.costUsd = roundUsd(activity.costUsd * scale);
    activity.spendingBreakdown = (activity.spendingBreakdown || []).map((item) => ({
      ...item,
      costUsd: roundUsd(item.costUsd * scale),
      estimated: true,
    }));
    activity.estimatedTotalCostUsd = sumCosts(activity.spendingBreakdown);
    activity.badges = [...new Set([...(activity.badges || []), "Ajustado al presupuesto"])];
    activity.notes = activity.notes
      ? `${activity.notes} Se ajusto el estimado a una opcion mas economica.`
      : "Se ajusto el estimado a una opcion mas economica.";
  }

  const fittedDays = refreshDayCosts(
    daysWithSpending.map((day) => ({
      ...day,
      spendingOptions: aggregateDailySpending(day.activities || []),
    }))
  );
  estimatedCostUsd = calculateItineraryCost(fittedDays);

  return {
    days: fittedDays,
    estimatedCostUsd,
    adjustment: "Se ajustaron costos estimados usando rangos economicos para mantenerse cerca del presupuesto.",
  };
}

export function recalculateDayCosts(day, userContext = {}) {
  const [dayWithSpending] = addSpendingOptions([{ ...day }], userContext);
  return refreshDayCosts([dayWithSpending])[0];
}

function addSpendingOptions(days, userContext) {
  return days.map((day, dayIndex) => {
    const activities = addActivitySpendingBreakdown(day.activities, userContext, dayIndex);
    const spendingOptions = aggregateDailySpending(activities);

    return {
      ...day,
      activities,
      spendingOptions,
    };
  });
}

function addActivitySpendingBreakdown(activities, userContext, dayIndex) {
  if (!Array.isArray(activities) || activities.length === 0) return activities || [];

  return activities.map((activity, activityIndex) => {
    const place = activity;
    const pricing = getActivityPricing(place);
    const baseCost = activity.costUsd ?? estimateActivityCost(place, userContext.travelers);
    const breakdown = [
      baseCost > 0 ? buildSpendingBreakdownItem(pricing.label, baseCost, getActivityCostDescription(place)) : null,
      ...buildContextualCosts({ activity, userContext, dayIndex, activityIndex }),
    ].filter((item) => item && item.costUsd > 0);

    return {
      ...activity,
      costUsd: roundUsd(baseCost),
      estimatedTotalCostUsd: sumCosts(breakdown),
      spendingBreakdown: breakdown,
    };
  });
}

function buildContextualCosts({ activity, userContext, dayIndex, activityIndex }) {
  const costs = [];
  const travelers = getTravelerCount(userContext.travelers);
  const category = getPrimaryCategory(activity);
  const message = String(userContext.message || "").toLowerCase();

  if (activityIndex === 0 && dayIndex === 0 && /\b(aeropuerto|airport|sal)\b/i.test(message)) {
    costs.push(
      buildSpendingBreakdownItem(
        "Traslado desde aeropuerto",
        estimateAirportTransfer(activity, travelers),
        "Rango realista para taxi/shuttle desde SAL segun distancia y zona."
      )
    );
  } else {
    const transportCost = estimateLocalTransport(activity, travelers);
    if (transportCost > 0) {
      costs.push(buildSpendingBreakdownItem("Transporte local", transportCost, "Taxi, rideshare o movilidad corta entre puntos cercanos."));
    }
  }

  if (["playa", "naturaleza", "aventura"].includes(category)) {
    costs.push(buildSpendingBreakdownItem("Parqueo, duchas o extras", Math.max(3, travelers * 2), "Extras comunes cuando aplica."));
  }

  if (category === "comida" && isPremiumPlace(activity)) {
    costs.push(buildSpendingBreakdownItem("Bebidas o propina", travelers * 4, "Margen para bebidas, propina o servicio."));
  }

  if (["vida_nocturna", "bebidas", "musica"].includes(category)) {
    costs.push(buildSpendingBreakdownItem("Propina o cover adicional", travelers * 3, "Margen para cover, servicio o consumo minimo."));
  }

  return costs;
}

function getActivityPricing(place) {
  const category = getPrimaryCategory(place);
  return BASE_ACTIVITY_COSTS[category] || BASE_ACTIVITY_COSTS.tour;
}

function getPrimaryCategory(place) {
  return place.type || place.categories?.[0] || "tour";
}

function getTravelerCount(travelers) {
  return Math.max(Number(travelers || 1), 1);
}

function getPriceMultiplier(place) {
  if (isPremiumPlace(place)) return 1.25;
  if (isBudgetPlace(place)) return 0.85;
  return 1;
}

function isPremiumPlace(place) {
  const text = normalizeCostText(`${place.name} ${place.type} ${place.zone} ${place.address}`);
  return PREMIUM_ZONE_PATTERN.test(text) || Number(place.rating || 0) >= 4.7;
}

function isBudgetPlace(place) {
  const text = normalizeCostText(`${place.name} ${place.type} ${place.zone} ${place.address}`);
  return BUDGET_PLACE_PATTERN.test(text) && !isPremiumPlace(place);
}

function estimateLocalTransport(activity, travelers) {
  const distanceKm = Number(activity.distanceMeters || 0) / 1000;
  const groupSizeMultiplier = travelers > 4 ? Math.ceil(travelers / 4) : 1;

  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 6 * groupSizeMultiplier;
  if (distanceKm <= 2) return 4 * groupSizeMultiplier;
  if (distanceKm <= 5) return 7 * groupSizeMultiplier;
  if (distanceKm <= 10) return 12 * groupSizeMultiplier;
  if (distanceKm <= 20) return 22 * groupSizeMultiplier;
  return 35 * groupSizeMultiplier;
}

function estimateAirportTransfer(activity, travelers) {
  const groupSizeMultiplier = travelers > 4 ? Math.ceil(travelers / 4) : 1;
  const distanceKm = Number(activity.distanceMeters || 0) / 1000;
  if (Number.isFinite(distanceKm) && distanceKm > 45) return 55 * groupSizeMultiplier;
  if (Number.isFinite(distanceKm) && distanceKm > 25) return 42 * groupSizeMultiplier;
  return 35 * groupSizeMultiplier;
}

function getActivityCostDescription(place) {
  const category = getPrimaryCategory(place);
  const descriptions = {
    playa: "Muchas playas no cobran entrada, pero puede haber consumo minimo o parqueo.",
    comida: "Estimado por plato principal sencillo o comida casual.",
    vida_nocturna: "Estimado por consumo responsable en bar o discoteca.",
    bebidas: "Estimado por bebidas o consumo minimo.",
    hospedaje: "Referencia de habitacion economica; puede variar por temporada.",
    tour: "Estimado para tour local sencillo o entrada guiada.",
    aventura: "Estimado para actividad con operador local.",
  };

  return descriptions[category] || "Estimado referencial segun categoria y zona.";
}

function buildSpendingBreakdownItem(category, costUsd, description) {
  return {
    category,
    costUsd: roundUsd(costUsd),
    description,
    estimated: true,
  };
}

function aggregateDailySpending(activities) {
  const totals = new Map();

  for (const activity of activities) {
    for (const item of activity.spendingBreakdown || []) {
      totals.set(item.category, (totals.get(item.category) || 0) + Number(item.costUsd || 0));
    }
  }

  return [...totals.entries()].map(([category, costUsd]) => ({
    category,
    costUsd: roundUsd(costUsd),
    description: "Total estimado del dia.",
  }));
}

function refreshDayCosts(days) {
  return days.map((day) => ({
    ...day,
    costUsd: sumCosts((day.activities || []).map((activity) => ({ costUsd: getActivityDisplayCost(activity) }))),
  }));
}

function calculateItineraryCost(days) {
  return sumCosts(days.map((day) => ({ costUsd: day.costUsd ?? sumCosts((day.activities || []).map((activity) => ({ costUsd: getActivityDisplayCost(activity) }))) })));
}

function getActivityDisplayCost(activity) {
  return Number(activity.estimatedTotalCostUsd ?? activity.costUsd ?? 0);
}

function sumCosts(items) {
  return roundUsd((items || []).reduce((sum, item) => sum + Number(item.costUsd || 0), 0));
}

function roundUsd(value) {
  return Math.max(0, Math.round(Number(value || 0)));
}

function normalizeCostText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
