import type {
  DifficultyScores,
  RouteSummary,
  UserProfile,
} from "./types";

export type Capability = {
  flatEndurance: number;
  climbing: number;
  riskTolerance: number;
  completeness: number;
};

const EXPERIENCE_SCORE: Record<UserProfile["experience"], number> = {
  beginner: 0.3,
  intermediate: 0.5,
  advanced: 0.72,
  expert: 0.88,
};

export function resolveProfile(
  partial?: Partial<UserProfile>,
): UserProfile & { usedDefaults: boolean } {
  const usedDefaults =
    !partial?.experience &&
    partial?.comfortableDistanceKm == null &&
    partial?.comfortableElevationM == null;

  return {
    experience: partial?.experience ?? "intermediate",
    comfortableDistanceKm: partial?.comfortableDistanceKm ?? 10,
    comfortableElevationM: partial?.comfortableElevationM ?? 500,
    riskPreference: partial?.riskPreference ?? "balanced",
    age: partial?.age,
    heightCm: partial?.heightCm,
    weightKg: partial?.weightKg,
    restingHr: partial?.restingHr,
    maxHr: partial?.maxHr,
    packWeightKg: partial?.packWeightKg ?? 5,
    usedDefaults,
  };
}

export function capabilityFromProfile(
  profile: UserProfile,
): Capability {
  const exp = EXPERIENCE_SCORE[profile.experience];
  const distComfort = Math.min(
    1,
    (profile.comfortableDistanceKm ?? 10) / 18,
  );
  const climbComfort = Math.min(
    1,
    (profile.comfortableElevationM ?? 500) / 1000,
  );
  const riskTolerance =
    profile.riskPreference === "conservative"
      ? 0.35
      : profile.riskPreference === "aggressive"
        ? 0.8
        : 0.55;

  let completeness = 0.45;
  if (profile.experience) completeness += 0.1;
  if (profile.comfortableDistanceKm != null) completeness += 0.08;
  if (profile.comfortableElevationM != null) completeness += 0.08;
  if (profile.riskPreference) completeness += 0.05;
  if (profile.heightCm && profile.weightKg && profile.restingHr) {
    completeness += 0.12;
  }

  return {
    flatEndurance: Math.min(1, exp * 0.55 + distComfort * 0.45),
    climbing: Math.min(1, exp * 0.45 + climbComfort * 0.55),
    riskTolerance,
    completeness: Math.min(0.9, completeness),
  };
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export function personalizeDifficulty(
  base: DifficultyScores,
  route: RouteSummary,
  profileInput?: Partial<UserProfile>,
): {
  personal: DifficultyScores;
  contributions: Array<{ code: string; label: string; delta: number }>;
  confidence: number;
} {
  const profile = resolveProfile(profileInput);
  const cap = capabilityFromProfile(profile);
  const contributions: Array<{ code: string; label: string; delta: number }> =
    [];

  const comfortDist = profile.comfortableDistanceKm ?? 10;
  const comfortElev = profile.comfortableElevationM ?? 500;
  const distDelta = route.distanceKm - comfortDist;
  const elevDelta = route.elevationGainM - comfortElev;

  let enduranceAdj = Math.round((0.5 - cap.flatEndurance) * 28);
  if (distDelta > 0) {
    const d = Math.round(Math.min(22, distDelta * 2.2));
    enduranceAdj += d;
    contributions.push({
      code: "distance_vs_comfort",
      label: "距离高于你的舒适区",
      delta: d,
    });
  } else if (distDelta < -2) {
    const d = Math.round(Math.max(-14, distDelta * 1.35));
    enduranceAdj += d;
    contributions.push({
      code: "distance_comfort",
      label: "距离在你的舒适区内",
      delta: d,
    });
  }

  let climbingAdj = Math.round((0.5 - cap.climbing) * 32);
  if (elevDelta > 0) {
    // Softer than /35 so +200–300m over comfort doesn't feel like a cliff.
    const d = Math.round(Math.min(18, elevDelta / 55));
    climbingAdj += d;
    contributions.push({
      code: "elevation_vs_comfort",
      label: "爬升高于你的舒适区",
      delta: d,
    });
  } else if (elevDelta < -80) {
    const d = Math.round(Math.max(-16, elevDelta / 50));
    climbingAdj += d;
    contributions.push({
      code: "elevation_comfort",
      label: "爬升在你的舒适区内",
      delta: d,
    });
  }

  // Route clearly inside comfort → stronger "this should feel easy" signal.
  const withinComfort =
    route.distanceKm <= comfortDist * 1.08 &&
    route.elevationGainM <= comfortElev * 1.15;
  if (withinComfort) {
    const ease = Math.round(-5 - EXPERIENCE_SCORE[profile.experience] * 10);
    contributions.push({
      code: "within_comfort",
      label: "整体落在你的舒适区内",
      delta: ease,
    });
    enduranceAdj += Math.round(ease * 0.45);
    climbingAdj += Math.round(ease * 0.55);
  }

  const expDelta = Math.round((0.5 - EXPERIENCE_SCORE[profile.experience]) * 16);
  if (expDelta !== 0) {
    contributions.push({
      code: "experience",
      label:
        expDelta > 0 ? "徒步经验相对有限" : "徒步经验较丰富",
      delta: expDelta,
    });
  }

  const riskAdj = Math.round((0.55 - cap.riskTolerance) * 18);
  if (profile.riskPreference === "conservative") {
    contributions.push({
      code: "risk_pref",
      label: "偏保守的风险偏好",
      delta: Math.max(0, riskAdj),
    });
  } else if (profile.riskPreference === "aggressive") {
    contributions.push({
      code: "risk_pref",
      label: "偏进取的风险偏好",
      delta: Math.min(0, riskAdj),
    });
  }

  const personal: DifficultyScores = {
    endurance: clamp(base.endurance + enduranceAdj),
    climbing: clamp(base.climbing + climbingAdj),
    weather: base.weather,
    risk: clamp(base.risk + riskAdj + Math.round(expDelta * 0.35)),
    overall: 0,
  };
  personal.overall = clamp(
    Math.round(
      personal.endurance * 0.34 +
        personal.climbing * 0.38 +
        personal.weather * 0.12 +
        personal.risk * 0.16 +
        expDelta * 0.25,
    ),
  );

  const confidence = profile.usedDefaults
    ? Math.min(cap.completeness, 0.52)
    : cap.completeness;

  return { personal, contributions, confidence };
}
