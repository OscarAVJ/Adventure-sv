const INTEREST_KEYWORDS = [
  { key: "playa", words: ["playa", "mar", "costa", "tunco", "zonte", "sunzal", "beach", "coast", "ocean", "sea"] },
  { key: "surf", words: ["surf", "surfear", "olas", "surfing", "waves"] },
  { key: "cultura", words: ["cultura", "museo", "historia", "colonial", "ruinas", "culture", "museum", "history", "ruins"] },
  { key: "naturaleza", words: ["naturaleza", "volcan", "cerro", "lago", "cascada", "parque", "nature", "volcano", "lake", "waterfall", "park", "hiking"] },
  { key: "hospedaje", words: ["hotel", "hostal", "hospedaje", "dormir", "hostel", "lodging", "stay", "sleep"] },
  { key: "comida", words: ["comida", "comer", "restaurante", "pupusa", "pupusas", "cafe", "cenar", "almorzar", "food", "eat", "restaurant", "coffee", "dinner", "lunch"] },
  {
    key: "vida_nocturna",
    words: ["bar", "bares", "discoteca", "discotecas", "antro", "antros", "club", "clubes", "fiesta", "noche", "vida nocturna", "nightlife", "night club", "party"],
  },
  { key: "bebidas", words: ["cerveza", "cervezas", "coctel", "cocteles", "tragos", "licores", "bebidas", "beer", "cocktail", "drinks"] },
  { key: "musica", words: ["musica", "musical", "dj", "baile", "bailar", "karaoke", "concierto", "music", "dance", "concert"] },
  { key: "tour", words: ["tour", "recorrido", "guia", "excursion", "visitar", "conocer", "visit", "explore", "sightseeing"] },
  { key: "romantico", words: ["romantico", "romantica", "pareja", "atardecer", "romantic", "couple", "sunset"] },
  { key: "familia", words: ["familia", "ninos", "nino", "familiar", "family", "kids", "children"] },
  { key: "compras", words: ["compras", "mercado", "artesanias", "souvenirs", "mall", "shopping", "market", "crafts"] },
  { key: "bienestar", words: ["spa", "masaje", "bienestar", "relajacion", "termales", "massage", "wellness", "relax"] },
];

const OCCASION_KEYWORDS = [
  { key: "birthday", words: ["cumpleanos", "cumple", "celebrar cumple", "birthday"] },
  { key: "anniversary", words: ["aniversario", "anniversary"] },
  { key: "family", words: ["familia", "familiar", "ninos", "nino", "family", "kids", "children"] },
  { key: "friends", words: ["amigos", "amigas", "grupo", "compas", "friends", "group"] },
  {
    key: "nightlife",
    words: ["bar", "bares", "discoteca", "discotecas", "antro", "antros", "fiesta", "vida nocturna", "salir de noche", "nightlife", "party"],
  },
  { key: "romantic", words: ["romantico", "romantica", "pareja", "romantic", "couple"] },
  { key: "adventure", words: ["aventura", "extremo", "adrenalina", "adventure", "extreme"] },
  { key: "rest", words: ["descanso", "relajar", "relax", "rest", "relaxing"] },
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
    lang: input.lang || "es",
  };
}

export function extractInterests(message) {
  const normalized = normalizeText(message);
  return INTEREST_KEYWORDS.filter(({ words }) => words.some((word) => includesNormalizedWord(normalized, word))).map(
    ({ key }) => key
  );
}

export function extractOccasion(message) {
  const normalized = normalizeText(message);
  return OCCASION_KEYWORDS.find(({ words }) => words.some((word) => includesNormalizedWord(normalized, word)))?.key || null;
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
  const asksForLodging = /\b(hotel|hoteles|hospedar|hospedarme|hospedaje|alojamiento|hostel|lodging|stay)\b/.test(normalized);
  const asksNearby = /\b(cerca|cercano|cercana|ahi|alli|alrededor|near|nearby|around)\b/.test(normalized);
  return asksForLodging && asksNearby;
}

function extractMaxActivitiesTotal(message) {
  const normalized = normalizeText(message);
  const match = normalized.match(/\b(?:unicamente|solo|solamente|only|just)\s+(?:quisiera|quiero|necesito|want|need)?\s*(?:esos|estos|these|those)?\s*(\d+)\s+(?:lugares|sitios|paradas|actividades|places|stops|activities)\b/);
  if (!match) return null;

  const amount = Number(match[1]);
  return Number.isInteger(amount) && amount > 0 && amount <= 10 ? amount : null;
}

function extractZone(message) {
  const normalized = normalizeText(message);
  return ZONE_KEYWORDS.find((zone) => normalized.includes(normalizeText(zone))) || extractFreeformZone(message);
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
  if (/\b(recorrido|bares?|discotecas?|lugares?|sitios?|tour|visitar|comer|cercanos?|el salvador)\b/.test(raw)) return false;
  return true;
}

function extractFreeformZone(message) {
  const text = String(message || "").trim();
  const match = text.match(/\b(?:cerca de|cerca del|por|en|near|around|in)\s+([^,.!?;]+?)(?=\s+(?:y|and|quiero|i want|tengo|i have|somos|we are|mi|my|la fecha|date|unicamente|únicamente|only)\b|,|\.|$)/i);
  if (!match) return null;

  const zone = match[1]
    .replace(/\b(?:lugares|sitios|restaurantes|comida|visitar)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return zone.length >= 3 && zone.length <= 80 ? zone : null;
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function includesNormalizedWord(normalizedText, word) {
  const normalizedWord = normalizeText(word);
  if (!normalizedWord) return false;
  const escapedWord = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escapedWord}($|[^a-z0-9])`).test(normalizedText);
}
