export type ExperienceLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type RiskPreference = "conservative" | "balanced" | "aggressive";

export type TrackPoint = {
  lat: number;
  lon: number;
  ele?: number;
};

export type UserProfile = {
  experience: ExperienceLevel;
  comfortableDistanceKm?: number;
  comfortableElevationM?: number;
  riskPreference?: RiskPreference;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  restingHr?: number;
  maxHr?: number;
  packWeightKg?: number;
};

export type WeatherSnapshot = {
  date?: string;
  lat?: number;
  lon?: number;
  temperatureC?: number;
  precipMm?: number;
  windMs?: number;
  humidity?: number;
  thunderstormRisk?: "low" | "medium" | "high" | "unknown";
  sunrise?: string;
  sunset?: string;
  source: "open-meteo" | "fallback";
};

export type DifficultyScores = {
  overall: number;
  endurance: number;
  climbing: number;
  weather: number;
  risk: number;
};

export type RouteSummary = {
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  minElevM: number;
  maxElevM: number;
  center: { lat: number; lon: number };
};

export type Segment = {
  idx: number;
  startKm: number;
  endKm: number;
  distanceM: number;
  gainM: number;
  lossM: number;
  avgGradePct: number;
  maxGradePct: number;
};

export type ElevationSample = {
  km: number;
  ele: number;
};

export type RouteAnalysis = {
  /** Empty/invalid input stays "stub"; successful parses use "ready". */
  status: "stub" | "ready";
  route: RouteSummary;
  segments: Segment[];
  elevationProfile: ElevationSample[];
  baseDifficulty: DifficultyScores;
  personalDifficulty: DifficultyScores;
  confidence: number;
  contributions: Array<{ code: string; label: string; delta: number }>;
  duration: {
    movingMin: number;
    totalMin: number;
    lowMin: number;
    highMin: number;
  };
  challenges: Array<{
    title: string;
    startKm: number;
    endKm: number;
    kind: string;
    severity: number;
  }>;
  recommendation: {
    suggestedStart?: string;
    finishWindow?: string;
    waterLiters?: number;
    mainRisk?: string;
    paceNote?: string;
  };
  band: "轻松" | "适中" | "吃力" | "很难" | "不建议";
  explanation: {
    text: string;
    source: "template" | "llm";
    /** Present when source is llm (e.g. deepseek-chat). */
    model?: string;
  };
  weather: WeatherSnapshot;
  physiological?: {
    gradeLabel: string;
    reserveHeartbeats: number;
    usedDefaults: boolean;
  };
};

export type AnalyzeRouteInput = {
  points: TrackPoint[];
  profile?: Partial<UserProfile>;
  weather?: WeatherSnapshot;
  plannedStart?: string;
};
