import type { WeatherSnapshot } from "@/lib/engine/types";

/** Open-Meteo daily block (subset we request). */
export type OpenMeteoDaily = {
  time?: string[];
  sunrise?: string[];
  sunset?: string[];
  precipitation_sum?: number[];
  temperature_2m_max?: number[];
  wind_speed_10m_max?: number[];
  /** Legacy alias still accepted by Open-Meteo */
  windspeed_10m_max?: number[];
  weather_code?: number[];
  relative_humidity_2m_max?: number[];
};

/**
 * WMO weather interpretation codes used by Open-Meteo.
 * @see https://open-meteo.com/en/docs
 */
export function thunderstormFromWeatherCode(
  code: number | undefined,
): WeatherSnapshot["thunderstormRisk"] {
  if (code == null || !Number.isFinite(code)) return "unknown";
  if (code === 95 || code === 96 || code === 99) return "high";
  // Heavy rain / violent rain showers often accompany convective risk
  if (code === 82 || code === 67) return "medium";
  return "low";
}

/** Open-Meteo daily wind maxima are km/h — store as m/s for the engine. */
export function kmhToMs(kmh: number | undefined): number | undefined {
  if (kmh == null || !Number.isFinite(kmh)) return undefined;
  return Number((kmh / 3.6).toFixed(2));
}

export function mapOpenMeteoDaily(input: {
  date: string;
  lat: number;
  lon: number;
  daily?: OpenMeteoDaily;
}): WeatherSnapshot {
  const daily = input.daily;
  const temperatureC = daily?.temperature_2m_max?.[0];
  const precipMm = daily?.precipitation_sum?.[0];
  const windKmh =
    daily?.wind_speed_10m_max?.[0] ?? daily?.windspeed_10m_max?.[0];
  const humidity = daily?.relative_humidity_2m_max?.[0];
  const weatherCode = daily?.weather_code?.[0];

  let thunderstormRisk = thunderstormFromWeatherCode(weatherCode);
  // If code missing, fall back to precip heuristic
  if (thunderstormRisk === "unknown" && precipMm != null) {
    thunderstormRisk =
      precipMm >= 25 ? "high" : precipMm >= 10 ? "medium" : "low";
  }

  return {
    date: input.date,
    lat: input.lat,
    lon: input.lon,
    temperatureC: temperatureC ?? 18,
    precipMm: precipMm ?? 0,
    windMs: kmhToMs(windKmh) ?? 0,
    humidity: humidity != null && Number.isFinite(humidity) ? humidity : undefined,
    thunderstormRisk,
    sunrise: daily?.sunrise?.[0],
    sunset: daily?.sunset?.[0],
    source: "open-meteo",
  };
}

export function openMeteoForecastUrl(input: {
  lat: number;
  lon: number;
  date: string;
}): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(input.lat));
  url.searchParams.set("longitude", String(input.lon));
  url.searchParams.set(
    "daily",
    [
      "sunrise",
      "sunset",
      "precipitation_sum",
      "temperature_2m_max",
      "wind_speed_10m_max",
      "weather_code",
      "relative_humidity_2m_max",
    ].join(","),
  );
  url.searchParams.set("timezone", "Asia/Shanghai");
  url.searchParams.set("start_date", input.date);
  url.searchParams.set("end_date", input.date);
  return url.toString();
}
