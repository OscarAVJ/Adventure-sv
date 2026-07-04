const INTEREST_KEYWORDS = [
  { key: "playa", words: ["playa", "mar", "costa", "tunco", "zonte", "sunzal"] },
  { key: "surf", words: ["surf", "surfear", "olas"] },
  { key: "cultura", words: ["cultura", "museo", "historia", "colonial", "ruinas"] },
  { key: "naturaleza", words: ["naturaleza", "volcan", "cerro", "lago", "cascada", "parque"] },
  { key: "hospedaje", words: ["hotel", "hostal", "hospedaje", "dormir"] },
  { key: "comida", words: ["comida", "restaurante", "pupusa", "pupusas", "cafe", "cenar", "almorzar"] },
  { key: "tour", words: ["tour", "recorrido", "guia", "excursion"] },
  { key: "romantico", words: ["romantico", "romantica", "pareja", "atardecer"] },
  { key: "familia", words: ["familia", "ninos", "niños", "familiar"] },
];

const OCCASION_KEYWORDS = [
  { key: "birthday", words: ["cumpleanos", "cumpleaños", "cumple"] },
  { key: "anniversary", words: ["aniversario"] },
  { key: "family", words: ["familia", "familiar", "ninos", "niños"] },
  { key: "friends", words: ["amigos", "amigas"] },
  { key: "romantic", words: ["romantico", "romantica", "pareja"] },
  { key: "adventure", words: ["aventura", "extremo", "adrenalina"] },
  { key: "rest", words: ["descanso", "relajar", "relax"] },
];

const ZONE_KEYWORDS = [
  "El Tunco",
  "El Zonte",
  "Suchitoto",
  "Ruta de Las Flores",
  "Santa Ana",
  "San Salvador",
  "La Libertad",
  "Lago de Coatepeque",
];

export function normalizeTripInput(input) {
  const message = input.message || "";
  const extractedInterests = extractInterests(message);
  const interests = uniqueValues([...(input.interests || []), ...extractedInterests]).map(normalizeText);
  const occasion = input.occasion || extractOccasion(message);
  const preferredZone = input.preferredZone || extractZone(message) || null;

  return {
    channel: input.channel,
    message,
    interests,
    budgetUsd: Number(input.budgetUsd),
    days: Number(input.days),
    startDate: input.startDate,
    preferredZone,
    occasion,
    travelers: Number(input.travelers || 1),
    conversationId: input.conversationId || null,
    phone: input.phone || null,
  };
}

export function extractInterests(message) {
  const normalized = normalizeText(message);
  return INTEREST_KEYWORDS.filter(({ words }) => words.some((word) => normalized.includes(normalizeText(word)))).map(
    ({ key }) => key
  );
}

export function extractOccasion(message) {
  const normalized = normalizeText(message);
  return OCCASION_KEYWORDS.find(({ words }) => words.some((word) => normalized.includes(normalizeText(word))))?.key || null;
}

function extractZone(message) {
  const normalized = normalizeText(message);
  return ZONE_KEYWORDS.find((zone) => normalized.includes(normalizeText(zone))) || null;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
