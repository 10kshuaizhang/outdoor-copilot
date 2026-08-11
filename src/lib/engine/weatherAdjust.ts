import { composeOverall } from "./baseDifficulty";
import type {
  DifficultyScores,
  RouteSummary,
  Segment,
  WeatherSnapshot,
} from "./types";

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

export type WeatherRouteContext = {
  route?: RouteSummary;
  segments?: Segment[];
};

/** Share of distance that is meaningfully descending / steep down. */
export function steepDescentShare(segments: Segment[]): number {
  if (segments.length === 0) return 0;
  let steepDownM = 0;
  let totalM = 0;
  for (const s of segments) {
    const len = Math.max(0, s.distanceM);
    totalM += len;
    const descending = s.lossM > s.gainM * 1.1 || s.avgGradePct <= -3;
    const steep = s.maxGradePct >= 12 || s.avgGradePct <= -8;
    if (descending && steep) steepDownM += len;
  }
  return totalM > 0 ? Math.min(1, steepDownM / totalM) : 0;
}

/**
 * Duration stretch only — keep moderate so weather doesn't invent
 * multi-hour padding on top of score coupling.
 */
export function weatherMultiplier(weather: WeatherSnapshot): number {
  let m = 1;
  const temp = weather.temperatureC ?? 18;
  const precip = weather.precipMm ?? 0;
  const wind = weather.windMs ?? 0;
  const humidity = weather.humidity ?? 0;

  if (temp >= 32) m *= 1.35;
  else if (temp >= 28) m *= 1.18;
  else if (temp <= 0) m *= 1.12;

  if (precip >= 5) m *= 1.12;
  else if (precip >= 1) m *= 1.05;

  // Storm slows movement some, but risk axis carries the "should I go" signal.
  if (weather.thunderstormRisk === "high") m *= 1.2;
  else if (weather.thunderstormRisk === "medium") m *= 1.1;

  if (wind >= 12) m *= 1.1;
  else if (wind >= 8) m *= 1.05;

  if (temp >= 28 && humidity >= 75) m *= 1.06;

  return m;
}

/**
 * Couple weather to what the route actually asks:
 * heat × climb effort, rain × steep descent, storm → environmental risk.
 * Avoid "m−1)×40 on endurance" for every weather type (double-blur).
 */
export function applyWeatherToScores(
  scores: DifficultyScores,
  weather: WeatherSnapshot,
  ctx: WeatherRouteContext = {},
): {
  scores: DifficultyScores;
  contributions: Array<{ code: string; label: string; delta: number }>;
  durationFactor: number;
} {
  const temp = weather.temperatureC ?? 18;
  const precip = weather.precipMm ?? 0;
  const wind = weather.windMs ?? 0;
  const humidity = weather.humidity ?? 0;
  const gain = ctx.route?.elevationGainM ?? 0;
  const climbEffort = Math.min(1.4, Math.max(0.35, gain / 900));
  const physical = scores.endurance / 100;
  const descentShare = steepDescentShare(ctx.segments ?? []);

  const contributions: Array<{ code: string; label: string; delta: number }> =
    [];

  let weatherAxis = 42;
  let enduranceBump = 0;
  let riskBump = 0;

  // --- Heat × climb / physical day ---
  if (temp >= 26) {
    const heatBase = temp >= 32 ? 18 : temp >= 28 ? 12 : 6;
    const humid = humidity >= 75 ? 1.25 : humidity >= 60 ? 1.1 : 1;
    const coupled = Math.round(heatBase * humid * (0.45 + 0.55 * climbEffort));
    enduranceBump += coupled;
    weatherAxis += Math.round(coupled * 0.9);
    contributions.push({
      code: "heat_climb",
      label:
        humidity >= 75
          ? "湿热叠加爬升，散热更难"
          : "偏热天气抬高爬升日负荷",
      delta: coupled,
    });
  }

  // --- Cold × wind (body cooling; no ridge fake without terrain) ---
  if (temp <= 2 || (temp <= 8 && wind >= 8)) {
    const cold = Math.round(
      (temp <= 0 ? 10 : 6) + Math.min(8, wind >= 8 ? (wind - 6) * 0.8 : 0),
    );
    weatherAxis += cold;
    riskBump += Math.round(cold * 0.5);
    contributions.push({
      code: "cold_wind",
      label: "低温/大风增加失温与行进负担",
      delta: cold,
    });
  } else if (wind >= 12) {
    const w = 6;
    weatherAxis += w;
    riskBump += 4;
    contributions.push({
      code: "wind",
      label: "强风增加行进负担",
      delta: w,
    });
  }

  // --- Rain × steep descent (slip / knee / caution) ---
  if (precip >= 0.5) {
    const rainBase = precip >= 8 ? 14 : precip >= 3 ? 9 : 5;
    const slip = Math.round(
      rainBase * (0.35 + 0.65 * Math.max(descentShare, 0.15)),
    );
    riskBump += slip;
    weatherAxis += Math.round(slip * 0.7);
    // Wet rock also costs a bit of moving efficiency on climb days.
    enduranceBump += Math.round(slip * 0.25 * (0.5 + 0.5 * physical));
    contributions.push({
      code: "rain_descent",
      label:
        descentShare >= 0.2
          ? "降水叠加陡下，湿滑与下坡风险上升"
          : "降水增加行进与打滑负担",
      delta: slip,
    });
  }

  // --- Thunderstorm: environmental / go-no-go, not fake endurance ---
  if (weather.thunderstormRisk === "high") {
    riskBump += 18;
    weatherAxis += 16;
    contributions.push({
      code: "storm_risk",
      label: "雷暴风险偏高，优先避险而非硬扛",
      delta: 18,
    });
  } else if (weather.thunderstormRisk === "medium") {
    riskBump += 10;
    weatherAxis += 10;
    contributions.push({
      code: "storm_risk",
      label: "对流天气可能增强，留意午后变化",
      delta: 10,
    });
  }

  weatherAxis = Math.min(100, Math.max(0, weatherAxis));
  const durationFactor = weatherMultiplier(weather);

  const next: DifficultyScores = {
    ...scores,
    weather: Math.round(weatherAxis),
    endurance: Math.min(100, Math.round(scores.endurance + enduranceBump)),
    risk: Math.min(100, Math.round(scores.risk + riskBump)),
    overall: 0,
  };
  next.overall = composeOverall(next);

  return { scores: next, contributions, durationFactor };
}
