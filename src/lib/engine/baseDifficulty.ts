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
 * Descent weighted lighter than climb (knees/focus, not cardio).
 * Used so short-steep and long-flat no longer collapse to "just km".
 */
export function equivalentEffortKm(route: RouteSummary): number {
  const dist = Math.max(0, route.distanceKm);
  const gain = Math.max(0, route.elevationGainM);
  const loss = Math.max(0, route.elevationLossM);
  return dist * 0.7 + gain / 100 + loss / 180;
}

export type RouteStructureMetrics = {
  climbDensityMPerKm: number;
  longestClimbKm: number;
  steepShare: number;
  hardClimbShare: number;
  rollingIndex: number;
  lateClimbShare: number;
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
  let totalSegGain = 0;
  for (const seg of segments) {
    totalSegGain += Math.max(0, seg.gainM);
    if (seg.startKm >= midKm) lateGain += Math.max(0, seg.gainM);
  }
  const lateClimbShare =
    totalSegGain > 0 ? Math.min(1, lateGain / totalSegGain) : 0;

  return {
    climbDensityMPerKm,
    longestClimbKm,
    steepShare,
    hardClimbShare,
    rollingIndex,
    lateClimbShare,
  };
}

/**
 * Physical load (stored as `endurance`): how much work the day asks.
 * Intensity / structure (stored as `climbing`): how that work is packed.
 * `risk` is no longer a second copy of dist+gain — only light operational
 * flags (big descent day, very long day, very high cumulative climb).
 */
export function computeBaseDifficulty(
  route: RouteSummary,
  segments: Segment[],
): DifficultyScores {
  const equiv = equivalentEffortKm(route);
  const structure = routeStructureMetrics(route, segments);

  // Physical: ~10 equiv → 轻松边；~22 → 适中；~35 → 吃力；~50+ → 很难+
  const endurance = clamp(equiv * 2.35);

  // Intensity: density + continuous climb + steep/hard shares + rolling + late climbs.
  // Cap continuous climb at 8 km so long ridges still matter without one-term saturation.
  const climbRun = Math.min(structure.longestClimbKm, 8);
  const climbing = clamp(
    structure.climbDensityMPerKm * 0.2 +
      climbRun * 6.5 +
      structure.steepShare * 32 +
      structure.hardClimbShare * 18 +
      structure.rollingIndex * 14 +
      structure.lateClimbShare * 10,
  );

  const weather = 42; // neutral; weatherAdjust still rewrites this

  const dist = route.distanceKm;
  const gain = route.elevationGainM;
  const loss = route.elevationLossM;
  const risk = clamp(
    Math.min(28, loss / 90) +
      (dist > 22 ? 10 : dist > 16 ? 5 : 0) +
      (gain > 1800 ? 12 : gain > 1200 ? 6 : 0),
  );

  // Blend physical + structure; weather placeholder + light operational risk.
  // Physical floor: a long day cannot read "轻松" just because intensity is low
  // (30 km / 400 m is endurance work, not an easy stroll).
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
