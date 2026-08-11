import type { WeatherSnapshot } from "@/lib/engine/types";
import { formatShanghaiClock } from "@/lib/time/china";
import { fallbackWeather } from "@/lib/engine/weatherAdjust";

/** Next calendar day in Asia/Shanghai after `YYYY-MM-DD`. */
export function shanghaiNextDay(dateYYYYMMDD: string): string {
  const d = new Date(`${dateYYYYMMDD}T12:00:00+08:00`);
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

/**
 * Overnight starts need hourly coverage into the next calendar day.
 * Late afternoon / evening departures (≥16:00 Shanghai) fetch through +1 day.
 */
export function weatherEndDateForStart(
  hikeDate: string,
  startIso?: string,
): string {
  if (!startIso) return hikeDate;
  const clock = formatShanghaiClock(startIso);
  if (clock === "—") return hikeDate;
  const hour = Number(clock.slice(0, 2));
  if (!Number.isFinite(hour) || hour < 16) return hikeDate;
  return shanghaiNextDay(hikeDate);
}

/** Browser-side weather fetch via Next.js Open-Meteo proxy. */
export async function fetchWeather(
  lat: number,
  lon: number,
  date: string,
  opts?: { startIso?: string },
): Promise<WeatherSnapshot> {
  try {
    const endDate = weatherEndDateForStart(date, opts?.startIso);
    const qs = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      date,
    });
    if (endDate !== date) qs.set("endDate", endDate);
    const res = await fetch(`/api/weather?${qs.toString()}`);
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
