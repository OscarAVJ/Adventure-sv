const WEATHER_CODE_LABELS = {
  0: "despejado",
  1: "mayormente despejado",
  2: "parcialmente nublado",
  3: "nublado",
  45: "con niebla",
  48: "con niebla escarchada",
  51: "con llovizna ligera",
  53: "con llovizna moderada",
  55: "con llovizna intensa",
  61: "con lluvia ligera",
  63: "con lluvia moderada",
  65: "con lluvia fuerte",
  80: "con chubascos ligeros",
  81: "con chubascos moderados",
  82: "con chubascos fuertes",
  95: "con tormenta",
};

export async function getWeatherSummary({ date, zone, coordinates }) {
  const forecast = await getWeatherForecast({ date, zone, coordinates });
  return forecast.summary;
}

export async function getWeatherForecast({ date, zone, coordinates }) {
  if (!hasCoordinates(coordinates)) {
    return buildFallbackForecast(zone);
  }

  try {
    const forecast = await fetchOpenMeteoForecast({ date, coordinates });
    if (!forecast) return buildFallbackForecast(zone);

    const condition = WEATHER_CODE_LABELS[forecast.weatherCode] || "variable";
    const rainText =
      typeof forecast.precipitationProbability === "number"
        ? ` Probabilidad de lluvia: ${forecast.precipitationProbability}%.`
        : "";

    return {
      ...forecast,
      condition,
      willRain: isRainyForecast(forecast),
      summary: `Clima esperado ${condition}, entre ${Math.round(forecast.minTemp)} C y ${Math.round(forecast.maxTemp)} C.${rainText}`,
    };
  } catch (error) {
    console.warn("Open-Meteo forecast unavailable", error.message);
    return buildFallbackForecast(zone);
  }
}

async function fetchOpenMeteoForecast({ date, coordinates }) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", coordinates.lat);
  url.searchParams.set("longitude", coordinates.lng);
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "America/El_Salvador");
  url.searchParams.set("start_date", date);
  url.searchParams.set("end_date", date);

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const index = data.daily?.time?.findIndex((day) => day === date) ?? -1;
  if (index < 0) return null;

  return {
    weatherCode: data.daily.weather_code?.[index],
    maxTemp: data.daily.temperature_2m_max?.[index],
    minTemp: data.daily.temperature_2m_min?.[index],
    precipitationProbability: data.daily.precipitation_probability_max?.[index],
  };
}

function hasCoordinates(coordinates) {
  return Number.isFinite(Number(coordinates?.lat)) && Number.isFinite(Number(coordinates?.lng));
}

function buildFallbackForecast(zone) {
  return {
    summary: `Clima esperado agradable para actividades en ${zone || "la zona seleccionada"}.`,
    precipitationProbability: null,
    weatherCode: null,
    condition: "variable",
    willRain: false,
  };
}

function isRainyForecast(forecast) {
  const rainCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95]);
  return Number(forecast.precipitationProbability || 0) >= 60 || rainCodes.has(Number(forecast.weatherCode));
}
