import type { RouteAnalysis, Segment, WeatherSnapshot } from "./types";

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

export function buildRecommendation(input: {
  durationMin: number;
  weather: WeatherSnapshot;
  personalOverall: number;
  plannedStart?: string;
}): RouteAnalysis["recommendation"] {
  const sunset = input.weather.sunset
    ? new Date(input.weather.sunset)
    : null;

  let suggested = input.plannedStart;
  if (!suggested) {
    const d = input.weather.date ? new Date(`${input.weather.date}T07:30:00`) : new Date();
    if (!input.weather.date) {
      d.setHours(7, 30, 0, 0);
    }
    // Prefer earlier start when hard or hot.
    if (input.personalOverall >= 65 || (input.weather.temperatureC ?? 18) >= 28) {
      d.setHours(6, 30, 0, 0);
    }
    suggested = d.toISOString();
  }

  const start = new Date(suggested);
  const finishLow = new Date(start.getTime() + input.durationMin * 0.9 * 60000);
  const finishHigh = new Date(start.getTime() + input.durationMin * 1.15 * 60000);

  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const temp = input.weather.temperatureC ?? 18;
  const waterLiters = Number(
    Math.max(0.8, input.durationMin / 60 * (temp >= 28 ? 0.7 : 0.45)).toFixed(1),
  );

  let mainRisk = "后程疲劳";
  if (input.weather.thunderstormRisk === "high") mainRisk = "雷暴风险";
  else if (temp >= 30) mainRisk = "热应激与脱水";
  else if (sunset && finishHigh > sunset) mainRisk = "可能天黑前无法结束";

  return {
    suggestedStart: suggested,
    finishWindow: `${fmt(finishLow)}–${fmt(finishHigh)}`,
    waterLiters,
    mainRisk,
    paceNote:
      input.personalOverall >= 65
        ? "建议前半段保守配速，把余力留给连续爬升。"
        : "保持均匀配速，爬升段主动减速。",
  };
}
