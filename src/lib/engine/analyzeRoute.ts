import {
  computeBaseDifficulty,
  estimateDurationMinutes,
  scoreBand,
} from "./baseDifficulty";
import { buildRecommendation, detectChallenges } from "./challenges";
import {
  accumulateDistances,
  elevationStats,
  routeCenter,
} from "./geo";
import { personalizeDifficulty } from "./personalize";
import { estimatePhysiologicalLoad } from "./physiology";
import { buildSegments } from "./segments";
import type {
  AnalyzeRouteInput,
  ElevationSample,
  RouteAnalysis,
} from "./types";
import {
  applyWeatherToScores,
  fallbackWeather,
} from "./weatherAdjust";

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
  const weather =
    input.weather ??
    fallbackWeather(0, 0);

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
      weather,
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
  let baseDifficulty = computeBaseDifficulty(route, segments);

  const weatherApplied = applyWeatherToScores(baseDifficulty, weather);
  baseDifficulty = weatherApplied.scores;

  const personalized = personalizeDifficulty(
    baseDifficulty,
    route,
    input.profile,
  );

  let duration = estimateDurationMinutes(route, personalized.personal);
  duration = {
    ...duration,
    movingMin: Math.round(duration.movingMin * weatherApplied.durationFactor),
    totalMin: Math.round(duration.totalMin * weatherApplied.durationFactor),
    lowMin: Math.round(duration.lowMin * weatherApplied.durationFactor),
    highMin: Math.round(duration.highMin * weatherApplied.durationFactor),
  };

  const physio = estimatePhysiologicalLoad({
    distanceM: route.distanceKm * 1000,
    elevationGainM: route.elevationGainM,
    durationMin: duration.totalMin,
    profile: input.profile,
  });

  const contributions = [
    ...personalized.contributions,
    ...weatherApplied.contributions,
  ];
  if (!physio.usedDefaults) {
    contributions.push({
      code: "physiology",
      label: `生理负荷参考 ${physio.gradeLabel}`,
      delta: 0,
    });
  }

  let confidence = personalized.confidence;
  if (weather.source === "fallback") confidence = Math.min(confidence, 0.62);
  else confidence = Math.min(0.9, confidence + 0.08);
  if (!physio.usedDefaults) confidence = Math.min(0.9, confidence + 0.05);

  const challenges = detectChallenges(segments, weather);
  const recommendation = buildRecommendation({
    durationMin: duration.totalMin,
    weather,
    personalOverall: personalized.personal.overall,
    plannedStart: input.plannedStart,
  });

  return {
    status: "ready",
    route,
    segments,
    elevationProfile,
    baseDifficulty,
    personalDifficulty: personalized.personal,
    confidence,
    contributions,
    duration,
    challenges,
    recommendation,
    band: scoreBand(personalized.personal.overall),
    explanation: {
      text: `这条路线约 ${route.distanceKm.toFixed(1)} km，累计爬升约 ${route.elevationGainM} m。基础负荷 ${baseDifficulty.overall}，对你约 ${personalized.personal.overall}（${scoreBand(personalized.personal.overall)}）。`,
      source: "template",
    },
    weather,
    physiological: {
      gradeLabel: physio.gradeLabel,
      reserveHeartbeats: physio.reserveHeartbeats,
      usedDefaults: physio.usedDefaults,
    },
  };
}
