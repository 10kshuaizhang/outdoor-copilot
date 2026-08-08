import type { DifficultyScores, RouteSummary, Segment } from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export function scoreBand(
  overall: number,
): "轻松" | "适中" | "吃力" | "很难" | "不建议" {
  // Calibrated for weekend Beijing day-hikes: common 8–12km / 500–800m
  // routes should land around 适中–偏吃力 for an intermediate profile,
  // not saturate near 很难.
  if (overall < 28) return "轻松";
  if (overall < 52) return "适中";
  if (overall < 72) return "吃力";
  if (overall < 88) return "很难";
  return "不建议";
}

export function computeBaseDifficulty(
  route: RouteSummary,
  segments: Segment[],
): DifficultyScores {
  const dist = route.distanceKm;
  const gain = route.elevationGainM;
  const climbDensity = dist > 0 ? gain / dist : 0;

  let longestClimbKm = 0;
  let run = 0;
  for (const seg of segments) {
    if (seg.gainM >= seg.lossM && seg.avgGradePct > 3) {
      run += seg.endKm - seg.startKm;
      longestClimbKm = Math.max(longestClimbKm, run);
    } else {
      run = 0;
    }
  }
  // Cap continuous-climb length so long ridgelines don't saturate at 100.
  const climbRun = Math.min(longestClimbKm, 5);

  const steepShare =
    segments.length === 0
      ? 0
      : segments.filter((s) => s.maxGradePct >= 15).length / segments.length;

  // Softer coefficients: prior climbing term (density*0.09 + run*18) hit 100
  // on typical 700–900m Beijing peaks and made everything feel "很难".
  const endurance = clamp(dist * 3.4 + climbDensity * 0.03);
  const climbing = clamp(
    climbDensity * 0.05 + climbRun * 9 + steepShare * 18,
  );
  const weather = 42; // mild neutral; weatherAdjust still raises this
  const risk = clamp(dist * 1.35 + gain / 55 + (dist > 18 ? 6 : 0));
  const overall = clamp(
    endurance * 0.36 + climbing * 0.34 + risk * 0.16 + weather * 0.14,
  );

  return {
    overall: Math.round(overall),
    endurance: Math.round(endurance),
    climbing: Math.round(climbing),
    weather: Math.round(weather),
    risk: Math.round(risk),
  };
}

export function estimateDurationMinutes(
  route: RouteSummary,
  base: DifficultyScores,
): { movingMin: number; totalMin: number; lowMin: number; highMin: number } {
  // Naismith-ish: 12 min/km + 10 min / 100m gain, adjusted by difficulty.
  const moving =
    route.distanceKm * 12 + (route.elevationGainM / 100) * 10;
  const difficultyFactor = 1 + (base.overall - 40) / 200;
  const movingMin = Math.max(1, Math.round(moving * difficultyFactor));
  const restFactor = 1 + Math.min(0.35, route.distanceKm * 0.015 + route.elevationGainM / 4000);
  const totalMin = Math.round(movingMin * restFactor);
  return {
    movingMin,
    totalMin,
    lowMin: Math.round(totalMin * 0.9),
    highMin: Math.round(totalMin * 1.15),
  };
}
