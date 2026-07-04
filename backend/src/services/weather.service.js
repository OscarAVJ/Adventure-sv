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
  if (!hasCoordinates(coordinates)) {
    return fallbackWeatherSummary(zone);
  }

  try {
    const forecast = await fetchOpenMeteoForecast({ date, coordinates });
    if (!forecast) return fallbackWeatherSummary(zone);

    const condition = WEATHER_CODE_LABELS[forecast.weatherCode] || "variable";
    const rainText =
      typeof forecast.precipitationProbability === "number"
        ? ` Probabilidad de lluvia: ${forecast.precipitationProbability}%.`
        : "";

    return `Clima esperado ${condition}, entre ${Math.round(forecast.minTemp)}°C y ${Math.round(
      forecast.maxTemp
    )}°C.${rainText}`;
  } catch (error) {
    console.warn("Open-Meteo forecast unavailable", error.message);
    return fallbackWeatherSummary(zone);
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

function fallbackWeatherSummary(zone) {
  return `Clima esperado agradable para actividades en ${zone || "la zona seleccionada"}.`;
}
