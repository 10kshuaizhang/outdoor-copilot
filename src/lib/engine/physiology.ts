import { composeOverall } from "./baseDifficulty";
import type { DifficultyScores, UserProfile } from "./types";

/**
 * Simplified planning-time estimate inspired by
 * 刘泓舟等《户外运动强度测定与定级》(2022).
 * Uses predicted duration median `tSec` to avoid circular dependency.
 */
export function estimatePhysiologicalLoad(input: {
  distanceM: number;
  elevationGainM: number;
  durationMin: number;
  profile?: Partial<UserProfile>;
}): {
  reserveHeartbeats: number;
  gradeLabel: string;
  usedDefaults: boolean;
  packWeightKg: number;
} {
  const r = input.profile?.restingHr ?? 70;
  const M = input.profile?.weightKg ?? 65;
  const H = (input.profile?.heightCm ?? 170) / 100;
  const m = input.profile?.packWeightKg ?? 5;
  const d = input.distanceM;
  const h = input.elevationGainM;
  const t = Math.max(60, input.durationMin * 60);

  const usedDefaults =
    input.profile?.restingHr == null ||
    input.profile?.weightKg == null ||
    input.profile?.heightCm == null;

  const S =
    (13 / 50000) *
    (60 * r * t +
      1587.6 * d +
      23709.6 * h +
      100.8 * m * t +
      (201 * M * t) / (H * H) -
      4049.4 * t);

  const reserve = Math.max(0, S - r * (t / 60));

  let gradeLabel = "0.5 级";
  if (reserve >= 28230) gradeLabel = "2.5 级";
  else if (reserve >= 23248) gradeLabel = "2.0 级";
  else if (reserve >= 19441) gradeLabel = "1.8 级";
  else if (reserve >= 16091) gradeLabel = "1.5 级";
  else if (reserve >= 11166) gradeLabel = "1.2 级";
  else if (reserve >= 8933) gradeLabel = "1.0 级";

  return {
    reserveHeartbeats: Math.round(reserve),
    gradeLabel,
    usedDefaults,
    packWeightKg: m,
  };
}

/** Map physiological estimate into score adjustments (hybrid layer). */
export function applyPhysiologyToScores(
  scores: DifficultyScores,
  physio: ReturnType<typeof estimatePhysiologicalLoad>,
): {
  scores: DifficultyScores;
  contributions: Array<{ code: string; label: string; delta: number }>;
} {
  const contributions: Array<{ code: string; label: string; delta: number }> =
    [];

  // Reserve heartbeat magnitude → small endurance/climbing nudges.
  const loadBump = Math.min(18, Math.round(physio.reserveHeartbeats / 2500));
  const packBump = Math.min(10, Math.max(0, Math.round((physio.packWeightKg - 5) * 1.6)));

  const enduranceDelta = Math.round(loadBump * 0.55 + packBump * 0.5);
  const climbingDelta = Math.round(loadBump * 0.45 + packBump * 0.7);

  if (enduranceDelta !== 0) {
    contributions.push({
      code: "physio_endurance",
      label: `生理负荷（${physio.gradeLabel}）影响耐力`,
      delta: enduranceDelta,
    });
  }
  if (climbingDelta !== 0) {
    contributions.push({
      code: "physio_climbing",
      label:
        packBump > 0
          ? `负重 ${physio.packWeightKg} kg 增加攀爬负荷`
          : `生理负荷影响攀爬`,
      delta: climbingDelta,
    });
  }

  const next: DifficultyScores = {
    ...scores,
    endurance: Math.min(100, scores.endurance + enduranceDelta),
    climbing: Math.min(100, scores.climbing + climbingDelta),
    overall: 0,
  };
  next.overall = composeOverall(next);

  return { scores: next, contributions };
}
