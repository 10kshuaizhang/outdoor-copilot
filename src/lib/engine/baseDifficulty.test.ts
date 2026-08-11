import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import {
  altitudeLoadBump,
  computeBaseDifficulty,
  equivalentEffortKm,
  scoreBand,
} from "./baseDifficulty";
import { buildSegments } from "./segments";
import type { TrackPoint } from "./types";

/** Build a synthetic track: constant grade over `distanceKm`. */
function gradeTrack(opts: {
  distanceKm: number;
  gainM: number;
  lossM?: number;
  points?: number;
}): TrackPoint[] {
  const n = opts.points ?? 60;
  const lossM = opts.lossM ?? opts.gainM;
  const climbPoints = Math.floor(n * 0.55);
  const descentPoints = n - climbPoints;
  const points: TrackPoint[] = [];
  let ele = 200;
  const climbStep = opts.gainM / Math.max(1, climbPoints);
  const lossStep = lossM / Math.max(1, descentPoints);
  const latStep = opts.distanceKm / 111 / Math.max(1, n - 1);

  for (let i = 0; i < n; i++) {
    if (i > 0 && i <= climbPoints) ele += climbStep;
    else if (i > climbPoints) ele -= lossStep;
    points.push({ lat: 40 + i * latStep, lon: 116, ele: Math.round(ele) });
  }
  return points;
}

/** Repeated up/down rolling hills. */
function rollingTrack(opts: {
  distanceKm: number;
  cycles: number;
  amplitudeM: number;
}): TrackPoint[] {
  const n = opts.cycles * 20;
  const points: TrackPoint[] = [];
  const latStep = opts.distanceKm / 111 / Math.max(1, n - 1);
  for (let i = 0; i < n; i++) {
    const phase = (i % 20) / 20;
    const ele =
      400 +
      (phase < 0.5
        ? phase * 2 * opts.amplitudeM
        : (1 - (phase - 0.5) * 2) * opts.amplitudeM);
    points.push({ lat: 40 + i * latStep, lon: 116, ele: Math.round(ele) });
  }
  return points;
}

function scoresFor(points: TrackPoint[]) {
  const analysis = analyzeRoute({
    points,
    weather: { source: "fallback", temperatureC: 18, precipMm: 0 },
  });
  return {
    route: analysis.route,
    base: analysis.baseDifficulty,
    band: analysis.band,
    segments: analysis.segments,
  };
}

describe("equivalentEffortKm", () => {
  it("weights climb more than flat distance", () => {
    const steep = equivalentEffortKm({
      distanceKm: 6,
      elevationGainM: 900,
      elevationLossM: 900,
      minElevM: 200,
      maxElevM: 1100,
      center: { lat: 0, lon: 0 },
    });
    const longFlat = equivalentEffortKm({
      distanceKm: 30,
      elevationGainM: 400,
      elevationLossM: 400,
      minElevM: 100,
      maxElevM: 300,
      center: { lat: 0, lon: 0 },
    });
    // Not asserting steep > long (30km still big), but climb must matter:
    expect(steep).toBeGreaterThan(15);
    expect(steep).toBeGreaterThan(6 * 0.7 + 2); // more than distance-only
    expect(longFlat).toBeGreaterThan(steep); // long day still heavier total work
  });
});

describe("P0 physical + intensity scoring sanity", () => {
  it("Easy: short, low climb → 轻松", () => {
    const { base, band } = scoresFor(
      gradeTrack({ distanceKm: 8, gainM: 300, lossM: 300 }),
    );
    expect(base.overall).toBeLessThan(36);
    expect(band).toBe("轻松");
  });

  it("Steep: short but continuous hard climb → at least 吃力, harder than Easy", () => {
    const easy = scoresFor(gradeTrack({ distanceKm: 8, gainM: 300 }));
    const steep = scoresFor(
      gradeTrack({ distanceKm: 6, gainM: 900, lossM: 900, points: 80 }),
    );
    expect(steep.base.overall).toBeGreaterThanOrEqual(52);
    expect(steep.base.overall).toBeGreaterThan(easy.base.overall + 15);
    expect(["吃力", "很难", "不建议"]).toContain(steep.band);
    // Structure must show up: climbing (intensity) not tiny
    expect(steep.base.climbing).toBeGreaterThan(40);
  });

  it("Long: long distance, modest climb → 适中/吃力 (not 轻松, not 很难+)", () => {
    const long = scoresFor(
      gradeTrack({ distanceKm: 30, gainM: 400, lossM: 400, points: 100 }),
    );
    const steep = scoresFor(
      gradeTrack({ distanceKm: 6, gainM: 900, lossM: 900, points: 80 }),
    );
    expect(long.base.overall).toBeGreaterThanOrEqual(36);
    expect(long.base.overall).toBeLessThan(72);
    expect(["适中", "吃力"]).toContain(long.band);
    // Intensity axis: steep packing should beat long-flat packing
    expect(steep.base.climbing).toBeGreaterThan(long.base.climbing);
    // Steep day should still feel at least as hard overall as long-flat
    expect(steep.base.overall).toBeGreaterThanOrEqual(long.base.overall - 5);
  });

  it("Classic weekend 12km/800m → 适中～吃力 on geometry alone", () => {
    const { base, band } = scoresFor(
      gradeTrack({ distanceKm: 12, gainM: 800, lossM: 800 }),
    );
    expect(base.overall).toBeGreaterThanOrEqual(36);
    expect(base.overall).toBeLessThan(72);
    expect(["适中", "吃力"]).toContain(band);
  });

  it("High cumulative (Xiaowutai-class ~24km / ~2100m) → 很难+", () => {
    const { base, band } = scoresFor(
      gradeTrack({
        distanceKm: 23.9,
        gainM: 2100,
        lossM: 2100,
        points: 120,
      }),
    );
    expect(base.overall).toBeGreaterThanOrEqual(72);
    expect(["很难", "不建议"]).toContain(band);
  });

  it("Rolling terrain is harder overall than same-distance low-gain trail", () => {
    const mellow = scoresFor(
      gradeTrack({ distanceKm: 12, gainM: 250, lossM: 250, points: 80 }),
    );
    const rolling = scoresFor(
      rollingTrack({ distanceKm: 12, cycles: 8, amplitudeM: 100 }),
    );
    expect(rolling.route.elevationGainM).toBeGreaterThan(
      mellow.route.elevationGainM,
    );
    // Same distance, more cumulative work → higher physical / overall.
    // (Gentle rolls can score lower "intensity" than one steep push; overall is the leader check.)
    expect(rolling.base.endurance).toBeGreaterThan(mellow.base.endurance);
    expect(rolling.base.overall).toBeGreaterThan(mellow.base.overall);
  });

  it("Heat raises personal/base weather path vs dry (same geometry)", () => {
    const points = gradeTrack({ distanceKm: 12, gainM: 800 });
    const dry = analyzeRoute({
      points,
      weather: {
        source: "open-meteo",
        temperatureC: 18,
        humidity: 40,
        precipMm: 0,
        thunderstormRisk: "low",
      },
    });
    const heat = analyzeRoute({
      points,
      weather: {
        source: "open-meteo",
        temperatureC: 32,
        humidity: 80,
        precipMm: 0,
        thunderstormRisk: "low",
      },
    });
    expect(heat.baseDifficulty.overall).toBeGreaterThan(
      dry.baseDifficulty.overall,
    );
    expect(heat.baseDifficulty.weather).toBeGreaterThan(
      dry.baseDifficulty.weather,
    );
  });

  it("Rain raises risk/weather vs dry", () => {
    const points = gradeTrack({ distanceKm: 10, gainM: 700, lossM: 700 });
    const dry = analyzeRoute({
      points,
      weather: {
        source: "open-meteo",
        temperatureC: 20,
        precipMm: 0,
        thunderstormRisk: "low",
      },
    });
    const rain = analyzeRoute({
      points,
      weather: {
        source: "open-meteo",
        temperatureC: 20,
        precipMm: 8,
        thunderstormRisk: "medium",
      },
    });
    expect(rain.baseDifficulty.overall).toBeGreaterThan(
      dry.baseDifficulty.overall,
    );
    expect(rain.baseDifficulty.risk).toBeGreaterThanOrEqual(
      dry.baseDifficulty.risk,
    );
  });

  it("risk is not a second copy of distance+gain (long flat risk << old-style)", () => {
    const long = computeBaseDifficulty(
      {
        distanceKm: 30,
        elevationGainM: 400,
        elevationLossM: 400,
        minElevM: 100,
        maxElevM: 300,
        center: { lat: 0, lon: 0 },
      },
      buildSegments(
        gradeTrack({ distanceKm: 30, gainM: 400, lossM: 400, points: 100 }),
      ),
    );
    // Old formula: 30*1.35 + 400/55 + 6 ≈ 54. Still well below that.
    expect(long.risk).toBeLessThan(48);
  });

  it("scoreBand thresholds unchanged", () => {
    expect(scoreBand(35)).toBe("轻松");
    expect(scoreBand(36)).toBe("适中");
    expect(scoreBand(71)).toBe("吃力");
    expect(scoreBand(72)).toBe("很难");
    expect(scoreBand(88)).toBe("不建议");
  });

  it("High elevation adds load vs same geometry at low altitude", () => {
    const low = computeBaseDifficulty(
      {
        distanceKm: 10,
        elevationGainM: 600,
        elevationLossM: 600,
        minElevM: 200,
        maxElevM: 800,
        center: { lat: 0, lon: 0 },
      },
      [],
    );
    const high = computeBaseDifficulty(
      {
        distanceKm: 10,
        elevationGainM: 600,
        elevationLossM: 600,
        minElevM: 3200,
        maxElevM: 3800,
        center: { lat: 0, lon: 0 },
      },
      [],
    );
    expect(high.endurance).toBeGreaterThan(low.endurance);
    expect(high.overall).toBeGreaterThan(low.overall);
    expect(altitudeLoadBump(3800)).toBe(10);
    expect(altitudeLoadBump(1800)).toBe(0);
  });

  it("Extreme inputs stay finite and within 0–100 / duration cap", () => {
    const insanePoints = Array.from({ length: 200 }, (_, i) => ({
      lat: 40 + i * 0.01,
      lon: 116,
      ele: 1000 + (i % 3) * 500,
    }));
    const result = analyzeRoute({
      points: insanePoints,
      weather: { source: "fallback", temperatureC: 18 },
    });
    expect(result.baseDifficulty.overall).toBeLessThanOrEqual(100);
    expect(result.baseDifficulty.endurance).toBeLessThanOrEqual(100);
    expect(Number.isFinite(result.duration.totalMin)).toBe(true);
    expect(result.duration.totalMin).toBeLessThanOrEqual(22 * 60);
    expect(result.duration.highMin).toBeGreaterThan(0);
  });
});
