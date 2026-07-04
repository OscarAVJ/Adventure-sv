import { Season } from "../models/Season.js";

const FALLBACK_SEASONS = [
  {
    key: "christmas",
    label: "Navidad",
    startMonth: 12,
    startDay: 1,
    endMonth: 12,
    endDay: 31,
    tags: ["luces", "cena", "familia"],
    preferredCategories: ["comida", "familia", "romantico"],
    zoneBoosts: [{ zone: "San Salvador", weight: 8 }],
    placeBoosts: [],
    active: true,
  },
  {
    key: "holy_week",
    label: "Semana Santa",
    startMonth: 3,
    startDay: 20,
    endMonth: 4,
    endDay: 15,
    tags: ["playa", "familia"],
    preferredCategories: ["playa", "tour", "familia"],
    zoneBoosts: [{ zone: "La Libertad", weight: 8 }],
    placeBoosts: [],
    active: true,
  },
  {
    key: "surf_season",
    label: "Temporada de surf",
    startMonth: 5,
    startDay: 1,
    endMonth: 10,
    endDay: 31,
    tags: ["surf", "playa"],
    preferredCategories: ["surf", "playa"],
    zoneBoosts: [{ zone: "El Tunco", weight: 10 }],
    placeBoosts: [],
    active: true,
  },
];

export async function findActiveSeason(dateValue) {
  const date = parseDateParts(dateValue);
  const dbSeasons = await safeFindSeasons();
  const seasons = dbSeasons.length > 0 ? dbSeasons : FALLBACK_SEASONS;
  return seasons.find((season) => season.active && isWithinSeason(date, season)) || null;
}

function parseDateParts(value) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day, ordinal: month * 100 + day };
}

function isWithinSeason(date, season) {
  const start = Number(season.startMonth) * 100 + Number(season.startDay);
  const end = Number(season.endMonth) * 100 + Number(season.endDay);

  if (start <= end) {
    return date.ordinal >= start && date.ordinal <= end;
  }

  return date.ordinal >= start || date.ordinal <= end;
}

async function safeFindSeasons() {
  if (Season.db.readyState !== 1) return [];
  return Season.find({ active: true }).lean();
}
