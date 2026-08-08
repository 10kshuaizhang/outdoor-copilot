import type { DifficultyScores, RouteSummary, Segment } from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export function scoreBand(
  overall: number,
): "轻松" | "适中" | "吃力" | "很难" | "不建议" {
  if (overall < 25) return "轻松";
  if (overall < 45) return "适中";
  if (overall < 65) return "吃力";
  if (overall < 85) return "很难";
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

  const steepShare =
    segments.length === 0
      ? 0
      : segments.filter((s) => s.maxGradePct >= 15).length / segments.length;

  const endurance = clamp(dist * 4.2 + climbDensity * 0.04);
  const climbing = clamp(
    climbDensity * 0.09 + longestClimbKm * 18 + steepShare * 25,
  );
  const weather = 50;
  const risk = clamp(dist * 1.8 + gain / 40 + (dist > 15 ? 8 : 0));
  const overall = clamp(endurance * 0.35 + climbing * 0.4 + risk * 0.15 + weather * 0.1);

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
