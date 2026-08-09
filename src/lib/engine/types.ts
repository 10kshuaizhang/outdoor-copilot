export type ExperienceLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type RiskPreference = "conservative" | "balanced" | "aggressive";

export type HikeVerdict = "go" | "caution" | "nogo";

export type HikeBriefPhase = {
  label: string;
  detail: string;
};

export type HikeBriefFeel = {
  sun: string;
  heat: string;
  humidity: string;
  slip: string;
};

/** Structured hike briefing for report + XHS-style copy. */
export type HikeBrief = {
  verdict: HikeVerdict;
  verdictLabel: string;
  headline: string;
  /** Opening paragraph under the headline. */
  lead: string;
  why: string;
  /** Blogger-style weather sections: 降雨 / 对流 / 风力 / 温度 / 紫外… */
  weatherBlocks: HikeBriefPhase[];
  /** Dual audience line, e.g. 新手不宜 / 老驴可谨慎冲. */
  audience: {
    novice: string;
    experienced: string;
  };
  phases: HikeBriefPhase[];
  feel: HikeBriefFeel;
  /** Rule-based clothing advice. */
  clothing: string[];
  /** Rule-based gear checklist. */
  gear: string[];
  /** Photography / visibility tips. */
  photoTips: string[];
  actions: string[];
  /** Deterministic template copy (numbers source of truth). */
  copyText: string;
  /** Optional LLM-polished XHS-style post; numbers must match copyText facts. */
  polishedCopy?: string;
  copySource?: "template" | "llm";
};

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
  /** Daily minimum when available. */
  temperatureMinC?: number;
  precipMm?: number;
  windMs?: number;
  humidity?: number;
  thunderstormRisk?: "low" | "medium" | "high" | "unknown";
  sunrise?: string;
  sunset?: string;
  uvIndexMax?: number;
  /** Human label for wetter hours, China local clock. */
  rainWindow?: string;
  peakHourPrecipMm?: number;
  cloudCoverPct?: number;
  visibilityKm?: number;
  modelAgreement?: {
    models: string[];
    precipMm: number[];
    level: "aligned" | "mixed" | "divergent" | "unknown";
    summary: string;
  };
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

/** Geometry-derived effort class (Week 2). Not terrain recognition. */
export type EffortLabel = "easy" | "hard_climb" | "moderate" | "descent";

export type Segment = {
  idx: number;
  startKm: number;
  endKm: number;
  distanceM: number;
  gainM: number;
  lossM: number;
  avgGradePct: number;
  maxGradePct: number;
  /** Relative effort points from GPX geometry only; not used in overall score. */
  estimatedEffort: number;
  effortLabel: EffortLabel;
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
  /** Structured hike briefing for report + XHS-style copy. */
  hikeBrief?: HikeBrief;
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
  /** Optional trail name for briefing headlines. */
  title?: string;
};
