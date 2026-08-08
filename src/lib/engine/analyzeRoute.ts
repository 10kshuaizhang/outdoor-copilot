import type { AnalyzeRouteInput, RouteAnalysis } from "./types";

const emptyScores = {
  overall: 0,
  endurance: 0,
  climbing: 0,
  weather: 0,
  risk: 0,
};

/**
 * Single public analysis seam for Outdoor Copilot.
 * Ticket 01: stub shape only — later tickets fill real computation.
 */
export function analyzeRoute(input: AnalyzeRouteInput): RouteAnalysis {
  const first = input.points[0];
  const center = first
    ? { lat: first.lat, lon: first.lon }
    : { lat: 0, lon: 0 };

  return {
    status: "stub",
    route: {
      distanceKm: 0,
      elevationGainM: 0,
      elevationLossM: 0,
      minElevM: 0,
      maxElevM: 0,
      center,
    },
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
      text: "分析引擎尚未计算完整结果（stub）。",
      source: "template",
    },
  };
}
