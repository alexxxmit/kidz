import type { Locale, WeatherContext } from "@kidz/contracts";

export type WeatherLocation = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type WeatherSnapshot = {
  temperatureC: number;
  feelsLikeC: number;
  precipitationProbability: number;
  windKph: number;
  weatherCode: number;
  observedAt: string;
  fetchedAt: string;
};

type GeocodingResponse = {
  results?: Array<{
    id: number;
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
};

type ForecastResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation_probability?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

const finite = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const parseWeatherLocation = (value: string | null): WeatherLocation | undefined => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<WeatherLocation>;
    if (typeof parsed.id !== "number" || typeof parsed.name !== "string" || typeof parsed.country !== "string" || typeof parsed.latitude !== "number" || typeof parsed.longitude !== "number" || typeof parsed.timezone !== "string") return undefined;
    return parsed as WeatherLocation;
  } catch {
    return undefined;
  }
};

export const parseWeatherSnapshot = (value: string | null): WeatherSnapshot | undefined => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<WeatherSnapshot>;
    if ([parsed.temperatureC, parsed.feelsLikeC, parsed.precipitationProbability, parsed.windKph, parsed.weatherCode].some((item) => typeof item !== "number") || typeof parsed.observedAt !== "string" || typeof parsed.fetchedAt !== "string") return undefined;
    return parsed as WeatherSnapshot;
  } catch {
    return undefined;
  }
};

export const searchWeatherLocations = async (query: string, locale: Locale): Promise<WeatherLocation[]> => {
  const term = query.trim();
  if (term.length < 2) return [];
  const params = new URLSearchParams({ name: term, count: "6", language: locale, format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) throw new Error(`WEATHER_GEOCODING_${response.status}`);
  const payload = await response.json() as GeocodingResponse;
  return (payload.results ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    country: item.country ?? "",
    ...(item.admin1 ? { admin1: item.admin1 } : {}),
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone ?? "auto",
  }));
};

export const loadCurrentWeather = async (location: WeatherLocation): Promise<WeatherSnapshot> => {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error(`WEATHER_FORECAST_${response.status}`);
  const payload = await response.json() as ForecastResponse;
  if (!payload.current || typeof payload.current.temperature_2m !== "number") throw new Error("WEATHER_FORECAST_INVALID");
  return {
    temperatureC: finite(payload.current.temperature_2m),
    feelsLikeC: finite(payload.current.apparent_temperature, payload.current.temperature_2m),
    precipitationProbability: Math.max(0, Math.min(100, finite(payload.current.precipitation_probability))),
    windKph: Math.max(0, finite(payload.current.wind_speed_10m)),
    weatherCode: finite(payload.current.weather_code),
    observedAt: payload.current.time ?? new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };
};

export const weatherKind = (code: number): "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm" => {
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code === 45 || code === 48) return "fog";
  if (code >= 1 && code <= 3) return "cloudy";
  return "clear";
};

export const weatherLabel = (snapshot: WeatherSnapshot, locale: Locale) => {
  const labels = {
    clear: { ru: "Ясно", en: "Clear" },
    cloudy: { ru: "Облачно", en: "Cloudy" },
    fog: { ru: "Туман", en: "Foggy" },
    rain: { ru: "Дождь", en: "Rain" },
    snow: { ru: "Снег", en: "Snow" },
    storm: { ru: "Гроза", en: "Storm" },
  } as const;
  return labels[weatherKind(snapshot.weatherCode)][locale];
};

export const weatherAdvice = (snapshot: WeatherSnapshot, locale: Locale) => {
  const feels = snapshot.feelsLikeC;
  if (snapshot.precipitationProbability >= 55 || weatherKind(snapshot.weatherCode) === "rain") return locale === "ru" ? "Учту дождь: пригодится непромокаемый верх и подходящая обувь." : "I’ll account for rain with a water-resistant layer and suitable shoes.";
  if (weatherKind(snapshot.weatherCode) === "snow") return locale === "ru" ? "Нужны тёплые слои и обувь, которая не промокнет от снега." : "Warm layers and snow-ready shoes will work best.";
  if (feels <= 2) return locale === "ru" ? "Соберу тёплый многослойный образ с верхней одеждой." : "I’ll build a warm layered look with outerwear.";
  if (feels <= 10) return locale === "ru" ? "Добавлю базовый слой, тёплый второй слой и верхнюю одежду." : "I’ll add a base, a warm middle layer, and outerwear.";
  if (feels <= 17 || snapshot.windKph >= 25) return locale === "ru" ? "Подойдёт лёгкий дополнительный слой поверх базы." : "A light extra layer over a base will work well.";
  if (feels >= 29) return locale === "ru" ? "Соберу лёгкий образ без лишних слоёв." : "I’ll keep the look light and avoid unnecessary layers.";
  return locale === "ru" ? "Погода мягкая — соберу образ без обязательной верхней одежды." : "The weather is mild, so outerwear can stay optional.";
};

export const toWeatherContext = (snapshot: WeatherSnapshot | undefined, occasion: WeatherContext["occasion"]): WeatherContext => ({
  temperatureC: snapshot?.temperatureC ?? 18,
  ...(snapshot ? { feelsLikeC: snapshot.feelsLikeC } : {}),
  rainProbability: (snapshot?.precipitationProbability ?? 0) / 100,
  windKph: snapshot?.windKph ?? 0,
  occasion,
});
