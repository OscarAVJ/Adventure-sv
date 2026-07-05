const LABELS = {
  es: {
    itineraryIntro: ({ days, occasionText, seasonText }) => `Te arme un itinerario de ${days} dias${occasionText}${seasonText}.`,
    occasionText: (label) => ` para ${label.toLowerCase()}`,
    seasonText: (label) => ` en temporada de ${label.toLowerCase()}`,
    budget: ({ estimated, budget }) => `Costo estimado: $${estimated} de $${budget}.`,
    day: "Dia",
    suggestedSpending: "Gastos sugeridos",
    alternatives: "Opciones alternativas",
    estimatedCost: "Costo estimado",
    status: "Estado",
    location: "Ubicacion",
    address: "Direccion",
    hours: "Horarios",
    openNow: "Abierto ahora",
    closedNow: "Cerrado ahora",
    hoursUnavailable: "Horario no disponible",
  },
  en: {
    itineraryIntro: ({ days, occasionText, seasonText }) => `I built a ${days}-day itinerary${occasionText}${seasonText}.`,
    occasionText: (label) => ` for ${label.toLowerCase()}`,
    seasonText: (label) => ` during ${label.toLowerCase()} season`,
    budget: ({ estimated, budget }) => `Estimated cost: $${estimated} of $${budget}.`,
    day: "Day",
    suggestedSpending: "Suggested spending",
    alternatives: "Alternative options",
    estimatedCost: "Estimated cost",
    status: "Status",
    location: "Location",
    address: "Address",
    hours: "Hours",
    openNow: "Open now",
    closedNow: "Closed now",
    hoursUnavailable: "Hours unavailable",
  },
};

const COST_LABELS = {
  "Acceso o consumo minimo": { en: "Access or minimum spend" },
  "Clase o alquiler de tabla": { en: "Surf lesson or board rental" },
  "Entrada cultural": { en: "Cultural entrance fee" },
  "Entrada o fee natural": { en: "Nature entrance fee" },
  "Hospedaje economico por noche": { en: "Budget lodging per night" },
  "Comida por persona": { en: "Food per person" },
  "Tour o actividad guiada": { en: "Tour or guided activity" },
  "Cena o experiencia especial": { en: "Dinner or special experience" },
  "Actividad familiar": { en: "Family activity" },
  "Actividad de aventura": { en: "Adventure activity" },
  "Consumo nocturno": { en: "Nightlife spending" },
  "Bebidas o consumo minimo": { en: "Drinks or minimum spend" },
  "Entrada o consumo musical": { en: "Music entry or spend" },
  "Compra sugerida": { en: "Suggested purchase" },
  "Spa o bienestar": { en: "Spa or wellness" },
  "Traslado desde aeropuerto": { en: "Airport transfer" },
  "Transporte local": { en: "Local transport" },
  "Parqueo, duchas o extras": { en: "Parking, showers, or extras" },
  "Bebidas o propina": { en: "Drinks or tip" },
  "Propina o cover adicional": { en: "Tip or extra cover" },
};

export function formatReplyText({ itinerary, occasionRule, season }) {
  const lang = itinerary.lang || "es";
  const labels = LABELS[lang] || LABELS.es;
  const occasionText = occasionRule ? labels.occasionText(occasionRule.label) : "";
  const seasonText = season ? labels.seasonText(season.label) : "";
  const header = labels.itineraryIntro({ days: itinerary.days.length, occasionText, seasonText });
  const budget = labels.budget({ estimated: itinerary.estimatedCostUsd, budget: itinerary.budgetUsd });
  const days = itinerary.days
    .map((day) => {
      const activities = day.activities.map((activity) => formatActivity(activity, lang)).join("\n");
      const spending = (day.spendingOptions || [])
        .map((option) => `  * ${translateCostLabel(option.category, lang)}: $${option.costUsd}`)
        .join("\n");
      const alternatives = (day.alternatives || [])
        .slice(0, 2)
        .map((option) => `  * ${option.name} (${option.zone})`)
        .join("\n");
      const spendingBlock = spending ? `\n${labels.suggestedSpending}:\n${spending}` : "";
      const alternativesBlock = alternatives ? `\n${labels.alternatives}:\n${alternatives}` : "";
      return `${labels.day} ${day.day} (${day.date}) - ${day.zone}\n${activities}${spendingBlock}${alternativesBlock}`;
    })
    .join("\n\n");

  return [header, budget, days].filter(Boolean).join("\n\n");
}

function formatActivity(activity, lang) {
  const labels = LABELS[lang] || LABELS.es;
  const status = formatOpenStatus(activity, lang);
  const cost = formatActivityCost(activity);
  const location = activity.googleMapsUrl ? `\n  ${labels.location}: ${activity.googleMapsUrl}` : "";
  const address = activity.address ? `\n  ${labels.address}: ${activity.address}` : "";
  const hours = formatOpeningHours(activity.openingHours);
  const breakdown = formatSpendingBreakdown(activity.spendingBreakdown, lang);

  return [
    `- ${activity.time} ${activity.name}: ${activity.notes}`,
    cost ? `  ${labels.estimatedCost}: ${cost}` : null,
    breakdown || null,
    status ? `  ${labels.status}: ${status}` : null,
    location || null,
    address || null,
    hours ? `  ${labels.hours}: ${hours}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatActivityCost(activity) {
  const value = activity.estimatedTotalCostUsd ?? activity.costUsd;
  return Number.isFinite(Number(value)) ? `$${value}` : "";
}

function formatSpendingBreakdown(spendingBreakdown, lang) {
  if (!Array.isArray(spendingBreakdown) || spendingBreakdown.length === 0) return "";
  return spendingBreakdown.map((item) => `  - ${translateCostLabel(item.category, lang)}: $${item.costUsd}`).join("\n");
}

function formatOpenStatus(activity, lang) {
  const labels = LABELS[lang] || LABELS.es;
  if (activity.openNow === true) return labels.openNow;
  if (activity.openNow === false) return labels.closedNow;
  return labels.hoursUnavailable;
}

function formatOpeningHours(openingHours) {
  if (!Array.isArray(openingHours) || openingHours.length === 0) return "";
  return openingHours.slice(0, 7).join(" | ");
}

function translateCostLabel(label, lang) {
  if (lang === "en") return COST_LABELS[label]?.en || label;
  return label;
}
