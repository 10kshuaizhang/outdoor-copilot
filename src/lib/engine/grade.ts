/** Hiking-plausible grade ceiling; GPX spikes above this are noise. */
export const MAX_PLAUSIBLE_GRADE_PCT = 45;

/** Ignore micro-steps — short GPS jitter invents absurd slopes. */
export const MIN_GRADE_SAMPLE_DIST_M = 8;

/** True when a single step is almost certainly a GPS/barometer spike. */
export function isElevationSpike(deltaEleM: number, distM: number): boolean {
  if (!(distM > 0) || !Number.isFinite(deltaEleM)) return true;
  // Huge vertical jump over a short horizontal step.
  if (distM < 40 && Math.abs(deltaEleM) > Math.max(distM * 0.6, 25)) return true;
  return false;
}

/**
 * Instantaneous grade (%) for one track step, or null if unusable.
 * Does not invent climb: returns signed percent (up positive).
 */
export function stepGradePct(deltaEleM: number, distM: number): number | null {
  if (!(distM >= MIN_GRADE_SAMPLE_DIST_M)) return null;
  if (isElevationSpike(deltaEleM, distM)) return null;
  return (deltaEleM / distM) * 100;
}

export function clampGradePct(gradePct: number): number {
  if (!Number.isFinite(gradePct)) return 0;
  return Math.min(MAX_PLAUSIBLE_GRADE_PCT, Math.max(0, Math.abs(gradePct)));
}
