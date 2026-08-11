import type { DifficultyScores, RouteSummary, Segment } from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export function scoreBand(
  overall: number,
): "轻松" | "适中" | "吃力" | "很难" | "不建议" {
  // Calibrated for weekend Beijing day-hikes.
  if (overall < 36) return "轻松";
  if (overall < 52) return "适中";
  if (overall < 72) return "吃力";
  if (overall < 88) return "很难";
  return "不建议";
}

/**
 * Recompose overall after any layer mutates component scores.
 * Physical (endurance) has a floor so long-flat days stay honest.
 */
export function composeOverall(
  scores: Pick<
    DifficultyScores,
    "endurance" | "climbing" | "weather" | "risk"
  >,
  extra = 0,
): number {
  const blend =
    scores.endurance * 0.48 +
    scores.climbing * 0.34 +
    scores.risk * 0.08 +
    scores.weather * 0.1 +
    extra;
  return clamp(Math.round(Math.max(blend, scores.endurance * 0.78)));
}

/**
 * Equivalent effort (km): flat distance + climb + descent burden.
 * Descent weighted for knees/quads — still lighter than climb, but not ignored.
 */
export function equivalentEffortKm(route: RouteSummary): number {
  const dist = Math.max(0, route.distanceKm);
  const gain = Math.max(0, route.elevationGainM);
  const loss = Math.max(0, route.elevationLossM);
  return dist * 0.7 + gain / 100 + loss / 140;
}

/**
 * Mild load from time spent high — not AMS diagnosis.
 * Uses summit/max elev from the track (best available without a DEM).
 */
export function altitudeLoadBump(maxElevM: number): number {
  if (!(maxElevM > 0) || !Number.isFinite(maxElevM)) return 0;
  if (maxElevM >= 4500) return 14;
  if (maxElevM >= 3500) return 10;
  if (maxElevM >= 3000) return 7;
  if (maxElevM >= 2500) return 4;
  return 0;
}

export type RouteStructureMetrics = {
  climbDensityMPerKm: number;
  longestClimbKm: number;
  longestDescentKm: number;
  steepShare: number;
  hardClimbShare: number;
  rollingIndex: number;
  lateClimbShare: number;
  lateDescentShare: number;
};

/**
 * Geometry structure from segments — the part a leader feels that
 * "total gain" alone cannot express.
 */
export function routeStructureMetrics(
  route: RouteSummary,
  segments: Segment[],
): RouteStructureMetrics {
  const dist = route.distanceKm;
  const gain = route.elevationGainM;
  const climbDensityMPerKm = dist > 0 ? gain / dist : 0;

  let longestClimbKm = 0;
  let longestDescentKm = 0;
  let climbRun = 0;
  let descentRun = 0;
  for (const seg of segments) {
    if (seg.gainM >= seg.lossM && seg.avgGradePct > 3) {
      climbRun += seg.endKm - seg.startKm;
      longestClimbKm = Math.max(longestClimbKm, climbRun);
      descentRun = 0;
    } else if (seg.lossM > seg.gainM * 1.1 && seg.avgGradePct < -2) {
      descentRun += seg.endKm - seg.startKm;
      longestDescentKm = Math.max(longestDescentKm, descentRun);
      climbRun = 0;
    } else {
      climbRun = 0;
      descentRun = 0;
    }
  }

  const steepShare =
    segments.length === 0
      ? 0
      : segments.filter((s) => s.maxGradePct >= 15).length / segments.length;

  const hardClimbShare =
    segments.length === 0
      ? 0
      : segments.filter((s) => s.effortLabel === "hard_climb").length /
        segments.length;

  // Rolling: climb↔descent switches (repeated ups/downs hurt more than one push).
  let switches = 0;
  let prevSign = 0;
  for (const seg of segments) {
    const net = seg.gainM - seg.lossM;
    const sign = net > 15 ? 1 : net < -15 ? -1 : 0;
    if (sign !== 0 && prevSign !== 0 && sign !== prevSign) switches += 1;
    if (sign !== 0) prevSign = sign;
  }
  const rollingIndex =
    segments.length <= 1 ? 0 : Math.min(1, switches / Math.max(3, segments.length * 0.35));

  const midKm = dist / 2;
  let lateGain = 0;
  let lateLoss = 0;
  let totalSegGain = 0;
  let totalSegLoss = 0;
  for (const seg of segments) {
    totalSegGain += Math.max(0, seg.gainM);
    totalSegLoss += Math.max(0, seg.lossM);
    if (seg.startKm >= midKm) {
      lateGain += Math.max(0, seg.gainM);
      lateLoss += Math.max(0, seg.lossM);
    }
  }
  const lateClimbShare =
    totalSegGain > 0 ? Math.min(1, lateGain / totalSegGain) : 0;
  const lateDescentShare =
    totalSegLoss > 0 ? Math.min(1, lateLoss / totalSegLoss) : 0;

  return {
    climbDensityMPerKm,
    longestClimbKm,
    longestDescentKm,
    steepShare,
    hardClimbShare,
    rollingIndex,
    lateClimbShare,
    lateDescentShare,
  };
}

/**
 * Physical load (stored as `endurance`): how much work the day asks.
 * Intensity / structure (stored as `climbing`): how that work is packed.
 * `risk` is light operational load (descent fatigue, long day, high camp).
 * Inputs are sanitized so extreme GPX junk cannot explode scores/duration.
 */
export function computeBaseDifficulty(
  route: RouteSummary,
  segments: Segment[],
): DifficultyScores {
  const safeRoute = sanitizeRouteSummary(route);
  const equiv = equivalentEffortKm(safeRoute);
  const structure = routeStructureMetrics(safeRoute, segments);
  const altBump = altitudeLoadBump(safeRoute.maxElevM);

  // Physical: ~10 equiv → 轻松边；~22 → 适中；~35 → 吃力；~50+ → 很难+
  const endurance = clamp(equiv * 2.35 + altBump * 0.65);

  // Intensity: density + continuous climb + steep/hard shares + rolling + late climbs.
  const climbRun = Math.min(structure.longestClimbKm, 8);
  const climbing = clamp(
    structure.climbDensityMPerKm * 0.2 +
      climbRun * 6.5 +
      structure.steepShare * 32 +
      structure.hardClimbShare * 18 +
      structure.rollingIndex * 14 +
      structure.lateClimbShare * 10 +
      altBump * 0.35,
  );

  const weather = 42; // neutral; weatherAdjust still rewrites this

  const dist = safeRoute.distanceKm;
  const gain = safeRoute.elevationGainM;
  const loss = safeRoute.elevationLossM;
  const descentRun = Math.min(structure.longestDescentKm, 8);
  const risk = clamp(
    Math.min(22, loss / 100) +
      descentRun * 2.2 +
      structure.lateDescentShare * 10 +
      (dist > 22 ? 10 : dist > 16 ? 5 : 0) +
      (gain > 1800 ? 10 : gain > 1200 ? 5 : 0) +
      Math.min(8, altBump * 0.4),
  );

  const overall = composeOverall({
    endurance,
    climbing,
    weather,
    risk,
  });

  return {
    overall,
    endurance: Math.round(endurance),
    climbing: Math.round(climbing),
    weather: Math.round(weather),
    risk: Math.round(risk),
  };
}

/** Clamp absurd track aggregates before they poison scoring/duration. */
export function sanitizeRouteSummary(route: RouteSummary): RouteSummary {
  return {
    ...route,
    distanceKm: clamp(route.distanceKm, 0, 120),
    elevationGainM: clamp(route.elevationGainM, 0, 8000),
    elevationLossM: clamp(route.elevationLossM, 0, 8000),
    minElevM: Number.isFinite(route.minElevM) ? route.minElevM : 0,
    maxElevM: Number.isFinite(route.maxElevM)
      ? clamp(route.maxElevM, -500, 9000)
      : 0,
  };
}

export function estimateDurationMinutes(
  route: RouteSummary,
  base: DifficultyScores,
): { movingMin: number; totalMin: number; lowMin: number; highMin: number } {
  const safe = sanitizeRouteSummary(route);
  // Naismith-ish: 12 min/km + 10 min / 100m gain, adjusted by difficulty.
  const moving = safe.distanceKm * 12 + (safe.elevationGainM / 100) * 10;
  const difficultyFactor = 1 + (base.overall - 40) / 200;
  // Thin air: slight pace tax above 2500 m (not a medical model).
  const altFactor = 1 + altitudeLoadBump(safe.maxElevM) / 100;
  const movingMin = Math.max(
    1,
    Math.round(moving * difficultyFactor * altFactor),
  );
  const restFactor =
    1 +
    Math.min(0.35, safe.distanceKm * 0.015 + safe.elevationGainM / 4000);
  // Hard ceiling ~22 h prevents absurd GPX from inventing multi-day windows.
  const totalMin = Math.min(22 * 60, Math.round(movingMin * restFactor));
  return {
    movingMin: Math.min(totalMin, movingMin),
    totalMin,
    lowMin: Math.round(totalMin * 0.9),
    highMin: Math.round(totalMin * 1.15),
  };
}
