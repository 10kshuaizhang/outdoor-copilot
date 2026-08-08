import {
  computeBaseDifficulty,
  estimateDurationMinutes,
  scoreBand,
} from "./baseDifficulty";
import {
  accumulateDistances,
  elevationStats,
  routeCenter,
} from "./geo";
import { buildSegments } from "./segments";
import type {
  AnalyzeRouteInput,
  ElevationSample,
  RouteAnalysis,
} from "./types";

const emptyScores = {
  overall: 0,
  endurance: 0,
  climbing: 0,
  weather: 0,
  risk: 0,
};

function buildElevationProfile(
  points: AnalyzeRouteInput["points"],
): ElevationSample[] {
  const cum = accumulateDistances(points);
  const samples: ElevationSample[] = [];
  const step = Math.max(1, Math.floor(points.length / 80));
  for (let i = 0; i < points.length; i += step) {
    const ele = points[i].ele;
    if (ele == null) continue;
    samples.push({ km: cum[i] / 1000, ele });
  }
  const last = points.length - 1;
  if (last > 0 && points[last].ele != null) {
    const lastSample = samples[samples.length - 1];
    if (!lastSample || lastSample.km !== cum[last] / 1000) {
      samples.push({ km: cum[last] / 1000, ele: points[last].ele as number });
    }
  }
  return samples;
}

/**
 * Single public analysis seam for Outdoor Copilot.
 */
export function analyzeRoute(input: AnalyzeRouteInput): RouteAnalysis {
  const points = input.points ?? [];
  if (points.length < 2) {
    return {
      status: "stub",
      route: {
        distanceKm: 0,
        elevationGainM: 0,
        elevationLossM: 0,
        minElevM: 0,
        maxElevM: 0,
        center: { lat: 0, lon: 0 },
      },
      segments: [],
      elevationProfile: [],
      baseDifficulty: { ...emptyScores },
      personalDifficulty: { ...emptyScores },
      confidence: 0.4,
      contributions: [],
      duration: {
        movingMin: 0,
        totalMin: 0,
        lowMin: 0,
        highMin: 0,
      },
      challenges: [],
      recommendation: {},
      band: "适中",
      explanation: {
        text: "需要有效的轨迹点才能分析路线。",
        source: "template",
      },
    };
  }

  const cum = accumulateDistances(points);
  const distanceKm = cum[cum.length - 1] / 1000;
  const elev = elevationStats(points);
  const route = {
    distanceKm: Number(distanceKm.toFixed(3)),
    elevationGainM: Math.round(elev.gainM),
    elevationLossM: Math.round(elev.lossM),
    minElevM: Math.round(elev.minElevM),
    maxElevM: Math.round(elev.maxElevM),
    center: routeCenter(points),
  };

  const segments = buildSegments(points);
  const elevationProfile = buildElevationProfile(points);
  const baseDifficulty = computeBaseDifficulty(route, segments);
  const duration = estimateDurationMinutes(route, baseDifficulty);

  return {
    status: "ready",
    route,
    segments,
    elevationProfile,
    baseDifficulty,
    // Ticket 04 will personalize; until then mirror base.
    personalDifficulty: { ...baseDifficulty },
    confidence: 0.55,
    contributions: [],
    duration,
    challenges: [],
    recommendation: {},
    band: scoreBand(baseDifficulty.overall),
    explanation: {
      text: `这条路线约 ${route.distanceKm.toFixed(1)} km，累计爬升约 ${route.elevationGainM} m。当前展示的是路线基础负荷，完善个人档案后可得到对你的难度。`,
      source: "template",
    },
  };
}
