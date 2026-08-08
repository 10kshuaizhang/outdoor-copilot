import type { WeatherSnapshot } from "@/lib/engine/types";
import { fallbackWeather } from "@/lib/engine/weatherAdjust";

/** Browser-side weather fetch via Next.js Open-Meteo proxy. */
export async function fetchWeather(
  lat: number,
  lon: number,
  date: string,
): Promise<WeatherSnapshot> {
  try {
    const res = await fetch(
      `/api/weather?lat=${lat}&lon=${lon}&date=${encodeURIComponent(date)}`,
    );
    if (!res.ok) return fallbackWeather(lat, lon, date);
    const data = (await res.json()) as WeatherSnapshot;
    if (data.source !== "open-meteo" && data.source !== "fallback") {
      return fallbackWeather(lat, lon, date);
    }
    return data;
  } catch {
    return fallbackWeather(lat, lon, date);
  }
}
