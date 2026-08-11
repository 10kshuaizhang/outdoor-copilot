import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { computeBaseDifficulty } from "./baseDifficulty";
import { SHORT_CLIMB_POINTS } from "./fixtures/shortClimb.points";
import { buildSegments } from "./segments";
import {
  applyWeatherToScores,
  steepDescentShare,
  weatherMultiplier,
} from "./weatherAdjust";
import type { TrackPoint } from "./types";

function gradeTrack(opts: {
  distanceKm: number;
  gainM: number;
  lossM?: number;
  points?: number;
}): TrackPoint[] {
  const n = opts.points ?? 60;
  const lossM = opts.lossM ?? opts.gainM;
  const climbPoints = Math.floor(n * 0.55);
  const points: TrackPoint[] = [];
  let ele = 200;
  const climbStep = opts.gainM / Math.max(1, climbPoints);
  const lossStep = lossM / Math.max(1, n - climbPoints);
  const latStep = opts.distanceKm / 111 / Math.max(1, n - 1);
  for (let i = 0; i < n; i++) {
    if (i > 0 && i <= climbPoints) ele += climbStep;
    else if (i > climbPoints) ele -= lossStep;
    points.push({ lat: 40 + i * latStep, lon: 116, ele: Math.round(ele) });
  }
  return points;
}

describe("analyzeRoute weather impact", () => {
  it("does not lower personal overall or duration high under hotter weather", () => {
    const mild = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "intermediate" },
      weather: {
        source: "open-meteo",
        temperatureC: 18,
        precipMm: 0,
        thunderstormRisk: "low",
      },
    });
    const hot = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "intermediate" },
      weather: {
        source: "open-meteo",
        temperatureC: 33,
        precipMm: 0,
        thunderstormRisk: "low",
      },
    });

    expect(hot.personalDifficulty.overall).toBeGreaterThanOrEqual(
      mild.personalDifficulty.overall,
    );
    expect(hot.duration.highMin).toBeGreaterThanOrEqual(mild.duration.highMin);
  });

  it("applies weather to duration once (no score×multiplier double count)", () => {
    const mild = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "intermediate" },
      weather: {
        source: "open-meteo",
        temperatureC: 18,
        precipMm: 0,
        thunderstormRisk: "low",
      },
    });
    const harsh = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "intermediate" },
      weather: {
        source: "open-meteo",
        temperatureC: 33,
        precipMm: 8,
        humidity: 80,
        windMs: 12,
        thunderstormRisk: "high",
      },
    });
    const ratio = harsh.duration.totalMin / mild.duration.totalMin;
    const m = weatherMultiplier({
      source: "open-meteo",
      temperatureC: 33,
      precipMm: 8,
      humidity: 80,
      windMs: 12,
      thunderstormRisk: "high",
    });
    expect(ratio).toBeGreaterThan(1.2);
    expect(ratio).toBeLessThanOrEqual(m + 0.15);
    expect(harsh.personalDifficulty.overall).toBeGreaterThan(
      mild.personalDifficulty.overall,
    );
  });
});

describe("weather × route coupling", () => {
  it("heat raises endurance more on a climb day than a flat day", () => {
    const flatPts = gradeTrack({ distanceKm: 12, gainM: 200, lossM: 200 });
    const climbPts = gradeTrack({ distanceKm: 12, gainM: 1100, lossM: 1100 });
    const weather = {
      source: "open-meteo" as const,
      temperatureC: 32,
      humidity: 80,
      precipMm: 0,
      thunderstormRisk: "low" as const,
    };

    const flatBase = computeBaseDifficulty(
      {
        distanceKm: 12,
        elevationGainM: 200,
        elevationLossM: 200,
        minElevM: 200,
        maxElevM: 400,
        center: { lat: 40, lon: 116 },
      },
      buildSegments(flatPts),
    );
    const climbBase = computeBaseDifficulty(
      {
        distanceKm: 12,
        elevationGainM: 1100,
        elevationLossM: 1100,
        minElevM: 200,
        maxElevM: 1300,
        center: { lat: 40, lon: 116 },
      },
      buildSegments(climbPts),
    );

    const flatW = applyWeatherToScores(flatBase, weather, {
      route: {
        distanceKm: 12,
        elevationGainM: 200,
        elevationLossM: 200,
        minElevM: 200,
        maxElevM: 400,
        center: { lat: 40, lon: 116 },
      },
      segments: buildSegments(flatPts),
    });
    const climbW = applyWeatherToScores(climbBase, weather, {
      route: {
        distanceKm: 12,
        elevationGainM: 1100,
        elevationLossM: 1100,
        minElevM: 200,
        maxElevM: 1300,
        center: { lat: 40, lon: 116 },
      },
      segments: buildSegments(climbPts),
    });

    const flatDelta = flatW.scores.endurance - flatBase.endurance;
    const climbDelta = climbW.scores.endurance - climbBase.endurance;
    expect(climbDelta).toBeGreaterThan(flatDelta);
    expect(climbW.contributions.some((c) => c.code === "heat_climb")).toBe(
      true,
    );
  });

  it("rain raises risk more when steep descent share is high", () => {
    const points = gradeTrack({
      distanceKm: 10,
      gainM: 700,
      lossM: 700,
      points: 80,
    });
    const segments = buildSegments(points);
    expect(steepDescentShare(segments)).toBeGreaterThan(0.05);

    const base = computeBaseDifficulty(
      {
        distanceKm: 10,
        elevationGainM: 700,
        elevationLossM: 700,
        minElevM: 200,
        maxElevM: 900,
        center: { lat: 40, lon: 116 },
      },
      segments,
    );
    const dry = applyWeatherToScores(
      base,
      {
        source: "open-meteo",
        temperatureC: 18,
        precipMm: 0,
        thunderstormRisk: "low",
      },
      {
        route: {
          distanceKm: 10,
          elevationGainM: 700,
          elevationLossM: 700,
          minElevM: 200,
          maxElevM: 900,
          center: { lat: 40, lon: 116 },
        },
        segments,
      },
    );
    const wet = applyWeatherToScores(
      base,
      {
        source: "open-meteo",
        temperatureC: 18,
        precipMm: 6,
        thunderstormRisk: "low",
      },
      {
        route: {
          distanceKm: 10,
          elevationGainM: 700,
          elevationLossM: 700,
          minElevM: 200,
          maxElevM: 900,
          center: { lat: 40, lon: 116 },
        },
        segments,
      },
    );
    expect(wet.scores.risk).toBeGreaterThan(dry.scores.risk);
    expect(wet.contributions.some((c) => c.code === "rain_descent")).toBe(true);
  });

  it("storm mainly lifts risk, not a huge endurance dump", () => {
    const points = SHORT_CLIMB_POINTS;
    const a = analyzeRoute({ points, weather: { source: "fallback" } });
    const base = a.baseDifficulty;
    // Re-apply from geometric by comparing storm vs clear on same geometry
    const clear = analyzeRoute({
      points,
      weather: {
        source: "open-meteo",
        temperatureC: 20,
        precipMm: 0,
        thunderstormRisk: "low",
      },
    });
    const storm = analyzeRoute({
      points,
      weather: {
        source: "open-meteo",
        temperatureC: 20,
        precipMm: 0,
        thunderstormRisk: "high",
      },
    });
    const riskDelta =
      storm.baseDifficulty.risk - clear.baseDifficulty.risk;
    const endDelta =
      storm.baseDifficulty.endurance - clear.baseDifficulty.endurance;
    expect(riskDelta).toBeGreaterThanOrEqual(12);
    expect(endDelta).toBeLessThan(riskDelta);
    expect(base.overall).toBeGreaterThan(0);
  });
});
