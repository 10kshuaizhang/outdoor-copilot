import type { UserProfile } from "./types";

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

  // Compacted form of paper eq. (6) with central coefficients.
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
  };
}
