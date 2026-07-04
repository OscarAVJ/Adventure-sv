export async function buildItinerarySummary({ userContext, season, occasionRule }) {
  const interestText = userContext.interests.join(", ");
  const occasionText = occasionRule ? ` para ${occasionRule.label.toLowerCase()}` : "";
  const seasonText = season ? ` en temporada de ${season.label.toLowerCase()}` : "";
  return `${userContext.days} dias de ${interestText}${occasionText}${seasonText}.`;
}
