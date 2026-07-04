import { normalizeText } from "./intent.service.js";

export function rankPlaces({ places, userContext, promotedPlaces = [], season, occasionRule }) {
  const promotedByPlaceId = new Map(promotedPlaces.map((place) => [place.googlePlaceId, place]));

  return places
    .map((place) => {
      const promotedPlace = promotedByPlaceId.get(place.googlePlaceId);
      const score = scorePlace({ place, userContext, promotedPlace, season, occasionRule });
      return {
        ...place,
        score,
        featured: Boolean(promotedPlace?.featured),
        promotedPlace,
      };
    })
    .filter((place) => place.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function scorePlace({ place, userContext, promotedPlace, season, occasionRule }) {
  const relevanceScore = getRelevanceScore(place, userContext);
  if (relevanceScore <= 0) return 0;

  const ratingScore = (place.rating || 0) * 10;
  const logisticsScore = getLogisticsScore(place, userContext);
  const promotedBoost = getPromotedBoost(place, promotedPlace, userContext);
  const seasonalBoost = getSeasonalBoost(place, season);
  const occasionBoost = getOccasionBoost(place, occasionRule);

  return relevanceScore + ratingScore + logisticsScore + promotedBoost + seasonalBoost + occasionBoost;
}

function getRelevanceScore(place, userContext) {
  const placeCategories = place.categories || [];
  const directMatches = placeCategories.filter((category) => userContext.interests.includes(category)).length;
  const text = normalizeText(`${place.name} ${place.type} ${place.zone}`);
  const textMatches = userContext.interests.filter((interest) => text.includes(normalizeText(interest))).length;
  return directMatches * 35 + textMatches * 10;
}

function getLogisticsScore(place, userContext) {
  if (!userContext.preferredZone) return 0;
  return normalizeText(place.zone) === normalizeText(userContext.preferredZone) ? 14 : 0;
}

function getPromotedBoost(place, promotedPlace, userContext) {
  if (!promotedPlace || promotedPlace.campaignStatus !== "active") return 0;

  const matchesCategory = (promotedPlace.categories || []).some((category) => userContext.interests.includes(category));
  if (!matchesCategory) return 0;

  return Number(promotedPlace.visibilityWeight || 0);
}

function getSeasonalBoost(place, season) {
  if (!season) return 0;

  const categoryBoost = (season.preferredCategories || []).some((category) => (place.categories || []).includes(category)) ? 12 : 0;
  const zoneBoost = (season.zoneBoosts || []).find((boost) => normalizeText(boost.zone) === normalizeText(place.zone))?.weight || 0;
  const placeBoost = (season.placeBoosts || []).find((boost) => boost.googlePlaceId === place.googlePlaceId)?.weight || 0;

  return categoryBoost + Number(zoneBoost) + Number(placeBoost);
}

function getOccasionBoost(place, occasionRule) {
  if (!occasionRule) return 0;

  const avoided = (occasionRule.avoidedCategories || []).some((category) => (place.categories || []).includes(category));
  if (avoided) return -20;

  const categoryBoost = (occasionRule.preferredCategories || []).some((category) => (place.categories || []).includes(category)) ? 12 : 0;
  const zoneBoost =
    (occasionRule.zoneBoosts || []).find((boost) => normalizeText(boost.zone) === normalizeText(place.zone))?.weight || 0;
  const placeBoost = (occasionRule.placeBoosts || []).find((boost) => boost.googlePlaceId === place.googlePlaceId)?.weight || 0;

  return categoryBoost + Number(zoneBoost) + Number(placeBoost);
}
