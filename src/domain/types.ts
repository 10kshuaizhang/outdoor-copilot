import type {
  DifficultyScores,
  ExperienceLevel,
  RiskPreference,
  RouteAnalysis,
  Segment,
  TrackPoint,
  WeatherSnapshot,
} from "@/lib/engine";

/** Anonymous local user (Week 1 — no auth). */
export type User = {
  id: string;
  createdAt: string;
};

/**
 * User-declared outdoor profile.
 * NOT the learned Personal Model.
 */
export type OutdoorProfile = {
  userId: string;
  updatedAt: string;
  experience: ExperienceLevel;
  /** Typical distance the user is comfortable with (km). */
  typicalDistanceKm?: number;
  /** Typical elevation gain (m). */
  typicalElevationM?: number;
  /** Optional: date of most recent hike (YYYY-MM-DD). */
  lastHikeAt?: string;
  riskPreference?: RiskPreference;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  restingHr?: number;
  maxHr?: number;
  packWeightKg?: number;
};

/**
 * Learned capability model — stub only in Week 1.
 * Must not be conflated with OutdoorProfile.
 */
export type PersonalModel = {
  userId: string;
  updatedAt: string;
  capabilities: Record<
    string,
    {
      score: number;
      confidence: number;
      sampleCount: number;
      modelVersion: string;
    }
  >;
};

export type RouteEntity = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  summary: RouteAnalysis["route"];
  segments: Segment[];
  /** Full track kept for re-analyze / Week 3 actual compare. */
  points: TrackPoint[];
  source: "upload" | "sample";
};

export type RouteSegmentEntity = Segment & {
  routeId: string;
};

export type AnalysisEntity = {
  id: string;
  userId: string;
  routeId: string;
  createdAt: string;
  modelVersion: string;
  /** Full engine output snapshot. */
  result: RouteAnalysis;
  profileSnapshot: Partial<OutdoorProfile>;
};

export type PredictionStatus = "saved" | "hiking" | "completed";

/**
 * Immutable prediction snapshot.
 * Never mutate numeric fields after create.
 */
export type Prediction = {
  id: string;
  userId: string;
  routeId: string;
  analysisId: string;
  createdAt: string;
  modelVersion: string;
  title: string;
  personalDifficulty: DifficultyScores;
  band: RouteAnalysis["band"];
  confidence: number;
  duration: RouteAnalysis["duration"];
  weatherSnapshot: WeatherSnapshot;
  profileSnapshot: Partial<OutdoorProfile>;
  /** Explanation frozen at save time. */
  explanation: RouteAnalysis["explanation"];
  status: PredictionStatus;
  outcomeId: string | null;
};

export type Activity = {
  id: string;
  userId: string;
  routeId: string;
  predictionId: string | null;
  createdAt: string;
  actualTotalMin?: number;
  points?: TrackPoint[];
};

export type Outcome = {
  id: string;
  predictionId: string;
  activityId: string;
  createdAt: string;
  predictedMidMin: number;
  actualTotalMin: number;
  errorPct?: number;
};

export type Feedback = {
  id: string;
  predictionId?: string;
  analysisId?: string;
  createdAt: string;
  perceivedDifficulty?: number;
  vsExpected?:
    | "much_easier"
    | "slightly_easier"
    | "about_right"
    | "slightly_harder"
    | "much_harder";
  actualTotalMin?: number;
};

/** Engine still uses UserProfile; map declared OutdoorProfile → engine shape. */
export function outdoorProfileToEngine(
  profile: Partial<OutdoorProfile> | null | undefined,
): Partial<import("@/lib/engine").UserProfile> {
  if (!profile) return {};
  return {
    experience: profile.experience,
    comfortableDistanceKm: profile.typicalDistanceKm,
    comfortableElevationM: profile.typicalElevationM,
    riskPreference: profile.riskPreference,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    restingHr: profile.restingHr,
    maxHr: profile.maxHr,
    packWeightKg: profile.packWeightKg,
  };
}

export function engineProfileToOutdoor(
  userId: string,
  profile: Partial<import("@/lib/engine").UserProfile> | null | undefined,
): OutdoorProfile {
  return {
    userId,
    updatedAt: new Date().toISOString(),
    experience: profile?.experience ?? "beginner",
    typicalDistanceKm: profile?.comfortableDistanceKm ?? 10,
    typicalElevationM: profile?.comfortableElevationM ?? 500,
    riskPreference: profile?.riskPreference,
    age: profile?.age,
    heightCm: profile?.heightCm,
    weightKg: profile?.weightKg,
    restingHr: profile?.restingHr,
    maxHr: profile?.maxHr,
    packWeightKg: profile?.packWeightKg,
  };
}

/** Personalization comfort scale recalibration (beginner 10/500; pro ceiling). */
export const MODEL_VERSION = "v0.1.1-comfort-scale";
