const INTEREST_KEYWORDS = [
  { key: "playa", words: ["playa", "mar", "costa", "tunco", "zonte", "sunzal"] },
  { key: "surf", words: ["surf", "surfear", "olas"] },
  { key: "cultura", words: ["cultura", "museo", "historia", "colonial", "ruinas"] },
  { key: "naturaleza", words: ["naturaleza", "volcan", "cerro", "lago", "cascada", "parque"] },
  { key: "hospedaje", words: ["hotel", "hostal", "hospedaje", "dormir"] },
  { key: "comida", words: ["comida", "restaurante", "pupusa", "pupusas", "cafe", "cenar", "almorzar"] },
  {
    key: "vida_nocturna",
    words: ["bar", "bares", "discoteca", "discotecas", "antro", "antros", "club", "clubes", "fiesta", "noche", "vida nocturna"],
  },
  { key: "bebidas", words: ["cerveza", "cervezas", "coctel", "cocteles", "tragos", "licores", "bebidas"] },
  { key: "musica", words: ["musica", "musical", "dj", "baile", "bailar", "karaoke", "concierto"] },
  { key: "tour", words: ["tour", "recorrido", "guia", "excursion"] },
  { key: "romantico", words: ["romantico", "romantica", "pareja", "atardecer"] },
  { key: "familia", words: ["familia", "ninos", "nino", "familiar"] },
  { key: "compras", words: ["compras", "mercado", "artesanias", "souvenirs", "mall"] },
  { key: "bienestar", words: ["spa", "masaje", "bienestar", "relajacion", "termales"] },
];

const OCCASION_KEYWORDS = [
  { key: "birthday", words: ["cumpleanos", "cumple", "celebrar cumple"] },
  { key: "anniversary", words: ["aniversario"] },
  { key: "family", words: ["familia", "familiar", "ninos", "nino"] },
  { key: "friends", words: ["amigos", "amigas", "grupo", "compas"] },
  {
    key: "nightlife",
    words: ["bar", "bares", "discoteca", "discotecas", "antro", "antros", "fiesta", "vida nocturna", "salir de noche"],
  },
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
  const preferredPlaces = uniqueValues([...(input.preferredPlaces || []), ...extractPreferredPlaces(message)]);
  const lodgingNearPreferredPlace = Boolean(input.lodgingNearPreferredPlace) || wantsLodgingNearPreferredPlace(message);
  const maxActivitiesTotal = input.maxActivitiesTotal || extractMaxActivitiesTotal(message);

  return {
    channel: input.channel,
    message,
    interests,
    preferredPlaces,
    lodgingNearPreferredPlace,
    maxActivitiesTotal,
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

export function extractPreferredPlaces(message) {
  const text = String(message || "").trim();
  const patterns = [
    /\b(?:mi\s+favorito|mi\s+favorita|favorito|favorita)\s+(?:es|se\s+llama)?\s+([^,.!?;]+)/i,
    /\b(?:lugar\s+especifico|lugar\s+favorito|incluye|incluir)\s+([^,.!?;]+)/i,
  ];
  const visitMatches = [...text.matchAll(/\b(?:quiero\s+ir\s+a|visitar|conocer)\s+([^,.!?;]+?)(?=\s+y\s+(?:posteriormente|despues|luego)|,|\.|$)/gi)].map(
    (match) => match[1]
  );

  return [
    ...patterns.map((pattern) => text.match(pattern)?.[1]),
    ...visitMatches,
  ]
    .filter(Boolean)
    .map((place) => ({ raw: place, clean: cleanPreferredPlace(place) }))
    .filter(({ raw, clean }) => isSpecificPlaceCandidate(raw, clean))
    .map(({ clean }) => clean);
}

function wantsLodgingNearPreferredPlace(message) {
  const normalized = normalizeText(message);
  const asksForLodging = /\b(hotel|hoteles|hospedar|hospedarme|hospedaje|alojamiento)\b/.test(normalized);
  const asksNearby = /\b(cerca|cercano|cercana|ahi|alli|alrededor)\b/.test(normalized);
  return asksForLodging && asksNearby;
}

function extractMaxActivitiesTotal(message) {
  const normalized = normalizeText(message);
  const match = normalized.match(/\b(?:unicamente|solo|solamente)\s+(?:quisiera|quiero|necesito)?\s*(?:esos|estos)?\s*(\d+)\s+(?:lugares|sitios|paradas|actividades)\b/);
  if (!match) return null;

  const amount = Number(match[1]);
  return Number.isInteger(amount) && amount > 0 && amount <= 10 ? amount : null;
}

function extractZone(message) {
  const normalized = normalizeText(message);
  return ZONE_KEYWORDS.find((zone) => normalized.includes(normalizeText(zone))) || null;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function cleanPreferredPlace(value) {
  return String(value || "")
    .replace(/\b(?:en|de)\s+el\s+salvador\b/gi, "")
    .replace(/\b(?:bares?|discotecas?|recorrido|tour|lugares?|sitios?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSpecificPlaceCandidate(rawValue, cleanValue) {
  const raw = normalizeText(rawValue);
  const clean = normalizeText(cleanValue);
  if (clean.length < 3 || clean.length > 80) return false;
  if (/\b(recorrido|bares?|discotecas?|lugares?|sitios?|tour|el salvador)\b/.test(raw)) return false;
  return true;
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
