import type { DifficultyScores, WeatherSnapshot } from "./types";

export function fallbackWeather(
  lat = 0,
  lon = 0,
  date?: string,
): WeatherSnapshot {
  const day = date ?? new Date().toISOString().slice(0, 10);
  return {
    date: day,
    lat,
    lon,
    temperatureC: 18,
    precipMm: 0,
    windMs: 2,
    thunderstormRisk: "unknown",
    sunrise: `${day}T06:00:00`,
    sunset: `${day}T18:30:00`,
    source: "fallback",
  };
}

export function weatherMultiplier(weather: WeatherSnapshot): number {
  let m = 1;
  const temp = weather.temperatureC ?? 18;
  const precip = weather.precipMm ?? 0;

  if (temp >= 32) m *= 1.5;
  else if (temp >= 28) m *= 1.25;
  else if (temp <= 0) m *= 1.15;

  if (precip >= 5) m *= 1.2;
  if (weather.thunderstormRisk === "high") m *= 1.35;
  else if (weather.thunderstormRisk === "medium") m *= 1.15;

  return m;
}

export function applyWeatherToScores(
  scores: DifficultyScores,
  weather: WeatherSnapshot,
): {
  scores: DifficultyScores;
  contributions: Array<{ code: string; label: string; delta: number }>;
  durationFactor: number;
} {
  const m = weatherMultiplier(weather);
  const contributions: Array<{ code: string; label: string; delta: number }> =
    [];
  const weatherScore = Math.round(
    Math.min(100, Math.max(0, 50 + (m - 1) * 80)),
  );
  const deltaWeather = weatherScore - scores.weather;
  if (deltaWeather !== 0) {
    const temp = weather.temperatureC ?? 18;
    contributions.push({
      code: "weather",
      label:
        temp >= 28
          ? "气温偏高，预期疲劳增加"
          : (weather.precipMm ?? 0) >= 5
            ? "降水增加行进负担"
            : "天气条件影响负荷",
      delta: deltaWeather,
    });
  }

  const riskBump =
    weather.thunderstormRisk === "high"
      ? 12
      : weather.thunderstormRisk === "medium"
        ? 6
        : 0;

  const next: DifficultyScores = {
    ...scores,
    weather: weatherScore,
    endurance: Math.min(
      100,
      Math.round(scores.endurance + Math.max(0, (m - 1) * 40)),
    ),
    risk: Math.min(100, scores.risk + riskBump),
    overall: 0,
  };
  next.overall = Math.round(
    next.endurance * 0.34 +
      next.climbing * 0.38 +
      next.weather * 0.12 +
      next.risk * 0.16,
  );

  return { scores: next, contributions, durationFactor: m };
}
