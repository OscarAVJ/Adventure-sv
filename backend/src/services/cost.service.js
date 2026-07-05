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
  aventura: 35,
  vida_nocturna: 25,
  bebidas: 18,
  musica: 20,
  compras: 20,
  bienestar: 35,
};

export function estimateActivityCost(place, travelers) {
  const type = place.type || place.categories?.[0] || "tour";
  const perPerson = BASE_COSTS[type] ?? 20;
  return Math.round(perPerson * Math.max(travelers, 1));
}

export function fitActivitiesToBudget(days, budgetUsd, userContext = {}) {
  const daysWithSpending = addSpendingOptions(days, userContext);
  const flattened = daysWithSpending.flatMap((day) => [...day.activities, ...day.spendingOptions]);
  let estimatedCostUsd = flattened.reduce((sum, item) => sum + item.costUsd, 0);

  if (estimatedCostUsd <= budgetUsd) {
    return { days: refreshDayCosts(daysWithSpending), estimatedCostUsd, adjustment: null };
  }

  const paidActivities = flattened.filter((activity) => activity.costUsd > 0);
  const scale = budgetUsd / estimatedCostUsd;

  for (const activity of paidActivities) {
    activity.costUsd = Math.max(0, Math.floor(activity.costUsd * scale));
    activity.badges = [...new Set([...(activity.badges || []), "Ajustado al presupuesto"])];
    if (activity.notes) {
      activity.notes = `${activity.notes} Se sugirio una opcion mas economica.`;
    } else if (activity.description) {
      activity.description = `${activity.description} Se sugirio una opcion mas economica.`;
    }
  }

  estimatedCostUsd = flattened.reduce((sum, item) => sum + item.costUsd, 0);

  return {
    days: refreshDayCosts(daysWithSpending),
    estimatedCostUsd,
    adjustment: "Se ajustaron costos estimados para mantenerse dentro del presupuesto.",
  };
}

export function recalculateDayCosts(day, userContext = {}) {
  const [dayWithSpending] = addSpendingOptions([{ ...day }], userContext);
  return refreshDayCosts([dayWithSpending])[0];
}

function addSpendingOptions(days, userContext) {
  const travelers = Math.max(Number(userContext.travelers || 1), 1);
  const message = String(userContext.message || "").toLowerCase();
  const includesAirportTransfer = message.includes("aeropuerto");
  const wantsLodging = userContext.interests?.includes("hospedaje") || /\b(hotel|hospedaje|hospedar|alojamiento)\b/.test(message);
  const wantsBeach = userContext.interests?.includes("playa") || /\b(playa|mar|costa|surf)\b/.test(message);

  return days.map((day, index) => {
    const spendingOptions = [
      buildSpendingOption("Comida y bebidas", 15 * travelers, "Desayuno sencillo, almuerzo local o snacks durante la ruta."),
      buildSpendingOption("Transporte local", 12 * travelers, "Movilidad corta entre playas, terminales o puntos cercanos."),
      wantsBeach
        ? buildSpendingOption("Extras de playa", 8 * travelers, "Parqueo, duchas, silla, casillero o consumo minimo cuando aplique.")
        : buildSpendingOption("Entradas o consumos", 8 * travelers, "Consumo minimo, parqueo o entrada sencilla cuando aplique."),
      includesAirportTransfer && index === 0
        ? buildSpendingOption("Traslado desde aeropuerto", 25 * travelers, "Estimado para iniciar la ruta desde el aeropuerto.")
        : null,
      wantsLodging ? buildSpendingOption("Hospedaje economico", 45 * travelers, "Referencia por noche en opcion sencilla cercana a la ruta.") : null,
    ].filter(Boolean);

    return {
      ...day,
      spendingOptions,
      activities: addActivitySpendingBreakdown(day.activities, spendingOptions),
    };
  });
}

function buildSpendingOption(category, costUsd, description) {
  return {
    category,
    costUsd: Math.round(costUsd),
    description,
  };
}

function addActivitySpendingBreakdown(activities, spendingOptions) {
  if (!Array.isArray(activities) || activities.length === 0) return activities || [];

  return activities.map((activity, index) => {
    const spendingBreakdown = [
      activity.costUsd > 0 ? buildSpendingBreakdownItem("Actividad", activity.costUsd, "Entrada, tour o consumo base.") : null,
      ...spendingOptions.map((option) => ({
        category: option.category,
        costUsd: splitCost(option.costUsd, activities.length, index),
        description: option.description,
      })),
    ].filter((item) => item && item.costUsd > 0);

    const estimatedTotalCostUsd = spendingBreakdown.reduce((sum, item) => sum + item.costUsd, 0);

    return {
      ...activity,
      estimatedTotalCostUsd,
      spendingBreakdown,
    };
  });
}

function buildSpendingBreakdownItem(category, costUsd, description) {
  return {
    category,
    costUsd: Math.round(costUsd),
    description,
  };
}

function splitCost(total, parts, index) {
  const base = Math.floor(total / parts);
  const remainder = total % parts;
  return base + (index < remainder ? 1 : 0);
}

function refreshDayCosts(days) {
  return days.map((day) => ({
    ...day,
    costUsd: [...day.activities, ...(day.spendingOptions || [])].reduce((sum, item) => sum + item.costUsd, 0),
  }));
}
