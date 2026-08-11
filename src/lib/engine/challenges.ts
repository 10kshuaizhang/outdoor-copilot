import {
  formatShanghaiClock,
  shanghaiToday,
  shanghaiWallIso,
} from "@/lib/time/china";
import type { RouteAnalysis, Segment, WeatherSnapshot } from "./types";

/** Parse Open-Meteo / ISO sunrise-sunset into an absolute instant. */
function parseChinaDayTime(raw?: string): Date | null {
  if (!raw) return null;
  // Already offset or Z
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // "2026-08-08T19:05" from Open-Meteo with timezone=Asia/Shanghai
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const d = new Date(`${raw.slice(0, 16)}:00+08:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function detectChallenges(
  segments: Segment[],
  weather: WeatherSnapshot,
): RouteAnalysis["challenges"] {
  const challenges: RouteAnalysis["challenges"] = [];

  let best = { startKm: 0, endKm: 0, gain: 0 };
  let runStart = 0;
  let runGain = 0;
  let inClimb = false;

  for (const seg of segments) {
    const climbing = seg.gainM >= seg.lossM && seg.avgGradePct > 4;
    if (climbing) {
      if (!inClimb) {
        inClimb = true;
        runStart = seg.startKm;
        runGain = 0;
      }
      runGain += seg.gainM;
      if (runGain > best.gain) {
        best = { startKm: runStart, endKm: seg.endKm, gain: runGain };
      }
    } else {
      inClimb = false;
      runGain = 0;
    }
  }

  if (best.gain >= 80) {
    challenges.push({
      title: `${best.startKm.toFixed(1)}–${best.endKm.toFixed(1)} km 连续爬升`,
      startKm: Number(best.startKm.toFixed(2)),
      endKm: Number(best.endKm.toFixed(2)),
      kind: "continuous_climb",
      severity: Math.min(100, Math.round(best.gain / 4)),
    });
  }

  const steep = segments
    .filter((s) => s.maxGradePct >= 18)
    .sort((a, b) => b.maxGradePct - a.maxGradePct)[0];
  if (steep) {
    challenges.push({
      title: `${steep.startKm.toFixed(1)}–${steep.endKm.toFixed(1)} km 陡坡段`,
      startKm: Number(steep.startKm.toFixed(2)),
      endKm: Number(steep.endKm.toFixed(2)),
      kind: "steep",
      severity: Math.min(100, Math.round(steep.maxGradePct * 3)),
    });
  }

  const endKm = segments[segments.length - 1]?.endKm ?? 0;

  if ((weather.temperatureC ?? 18) >= 28) {
    challenges.push({
      title: "高温时段预期疲劳上升",
      startKm: 0,
      endKm,
      kind: "heat",
      severity: 70,
    });
  }

  if (
    weather.thunderstormRisk === "high" ||
    weather.thunderstormRisk === "medium"
  ) {
    challenges.push({
      title:
        weather.thunderstormRisk === "high"
          ? "雷暴风险偏高，注意早出发与避险"
          : "对流天气可能增强，留意午后变化",
      startKm: 0,
      endKm,
      kind: "thunderstorm",
      severity: weather.thunderstormRisk === "high" ? 85 : 60,
    });
  }

  return challenges.slice(0, 3);
}

/**
 * Daylight vs night risk relative to planned start / finish.
 * "天黑前无法结束" only applies to daytime starts that overrun sunset.
 * Night / pre-dawn starts are intentional darkness — different wording.
 */
export function daylightRiskLabel(input: {
  start: Date;
  finishHigh: Date;
  sunrise: Date | null;
  sunset: Date | null;
}): string | null {
  const startMs = input.start.getTime();
  const finishMs = input.finishHigh.getTime();
  const sunriseMs = input.sunrise?.getTime() ?? null;
  const sunsetMs = input.sunset?.getTime() ?? null;

  // After sunset on the weather day → night / overnight hike.
  if (sunsetMs != null && startMs >= sunsetMs) {
    return "夜间行进（需头灯）";
  }

  // Before sunrise → early / all-night start on that calendar morning.
  if (sunriseMs != null && startMs < sunriseMs) {
    if (finishMs <= sunriseMs) return "全程夜间行进（需头灯）";
    return "凌晨出发，前段需头灯";
  }

  // Daytime start: finishing after sunset is the classic overrun risk.
  if (sunsetMs != null && finishMs > sunsetMs) {
    return "可能天黑前无法结束";
  }

  return null;
}

export function buildRecommendation(input: {
  durationMin: number;
  weather: WeatherSnapshot;
  personalOverall: number;
  plannedStart?: string;
  /** Route climb — bumps carry slightly on big days. */
  elevationGainM?: number;
}): RouteAnalysis["recommendation"] {
  const sunset = parseChinaDayTime(input.weather.sunset);
  const sunrise = parseChinaDayTime(input.weather.sunrise);
  const day = input.weather.date ?? shanghaiToday();

  let suggested = input.plannedStart;
  if (!suggested) {
    // Default morning start in China local time (not browser/UTC local).
    let hour = 7;
    let minute = 30;
    if (
      input.personalOverall >= 65 ||
      (input.weather.temperatureC ?? 18) >= 28
    ) {
      hour = 6;
      minute = 30;
    }
    suggested = shanghaiWallIso(day, hour, minute);
  }

  const start = new Date(suggested);
  const finishLow = new Date(start.getTime() + input.durationMin * 0.9 * 60000);
  const finishHigh = new Date(
    start.getTime() + input.durationMin * 1.15 * 60000,
  );

  const temp = input.weather.temperatureC ?? 18;
  const water = estimateWaterPlan({
    durationMin: input.durationMin,
    temperatureC: temp,
    elevationGainM: input.elevationGainM ?? 0,
  });

  let mainRisk = "后程疲劳";
  if (input.weather.thunderstormRisk === "high") mainRisk = "雷暴风险";
  else if (temp >= 30) mainRisk = "热应激与脱水";
  else {
    const lightRisk = daylightRiskLabel({
      start,
      finishHigh,
      sunrise,
      sunset,
    });
    if (lightRisk) mainRisk = lightRisk;
  }

  const nightPace =
    mainRisk.includes("夜间") || mainRisk.includes("凌晨");

  return {
    suggestedStart: suggested,
    finishWindow: `${formatShanghaiClock(finishLow.toISOString())}–${formatShanghaiClock(finishHigh.toISOString())}`,
    waterLiters: water.carryLiters,
    waterCarryLiters: water.carryLiters,
    waterConsumeLiters: water.consumeLiters,
    waterNote: water.note,
    mainRisk,
    paceNote: nightPace
      ? "夜行节奏宜稳，关键节点预留辨路时间。预估为行进向时长；含长时间观景/用餐会明显更久。"
      : input.personalOverall >= 65
        ? "建议前半段保守配速，把余力留给连续爬升。预估为行进向时长；含长时间观景/用餐会明显更久。"
        : "保持均匀配速，爬升段主动减速。预估为行进向时长；含长时间观景/用餐会明显更久。",
  };
}

/**
 * Split physiological day consumption from trailhead carry.
 * Leaders quote carry (2–3.5 L typical); full-day sweat can be higher with refills.
 */
export function estimateWaterPlan(input: {
  durationMin: number;
  temperatureC: number;
  elevationGainM?: number;
}): { consumeLiters: number; carryLiters: number; note: string } {
  const temp = input.temperatureC;
  const hours = Math.max(0.5, input.durationMin / 60);
  // Cap the hours used for sweat math — rest/padding shouldn't invent 8 L drinks.
  const effortHours = Math.min(hours, 10);

  let rate = 0.4;
  if (temp >= 32) rate = 0.65;
  else if (temp >= 28) rate = 0.55;
  else if (temp >= 22) rate = 0.45;

  const consumeLiters = Number(
    Math.max(0.8, effortHours * rate).toFixed(1),
  );

  const gain = Math.max(0, input.elevationGainM ?? 0);
  let carry =
    1.6 +
    Math.min(1.2, gain / 1500) +
    (temp >= 28 ? 0.4 : 0) +
    (temp >= 32 ? 0.4 : 0) +
    (effortHours >= 8 ? 0.4 : effortHours >= 5 ? 0.2 : 0);

  // Pack weight sanity: day-hike start load, not a full desert cache.
  carry = Math.min(3.5, Math.max(1.5, carry));
  const carryLiters = Number(carry.toFixed(1));

  const note =
    consumeLiters > carryLiters + 0.4
      ? `预计消耗约 ${consumeLiters} L（热天/长日）；出发建议携行 ${carryLiters} L，并确认沿途补水。无可靠水源时按消耗准备。`
      : `出发建议携行约 ${carryLiters} L；按强度与气温增减，优先确认水源。`;

  return { consumeLiters, carryLiters, note };
}
