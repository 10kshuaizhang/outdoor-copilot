import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import {
  SHORT_CLIMB_EXPECT,
  SHORT_CLIMB_POINTS,
} from "./fixtures/shortClimb.points";

const BANDS = ["轻松", "适中", "吃力", "很难", "不建议"] as const;

function expectFullShape(result: ReturnType<typeof analyzeRoute>) {
  expect(result.status).toMatch(/^(stub|ready)$/);
  expect(result.route).toEqual(
    expect.objectContaining({
      distanceKm: expect.any(Number),
      elevationGainM: expect.any(Number),
      elevationLossM: expect.any(Number),
      minElevM: expect.any(Number),
      maxElevM: expect.any(Number),
      center: expect.objectContaining({
        lat: expect.any(Number),
        lon: expect.any(Number),
      }),
    }),
  );

  for (const block of [result.baseDifficulty, result.personalDifficulty]) {
    expect(block).toEqual(
      expect.objectContaining({
        overall: expect.any(Number),
        endurance: expect.any(Number),
        climbing: expect.any(Number),
        weather: expect.any(Number),
        risk: expect.any(Number),
      }),
    );
  }

  expect(result.confidence).toBeGreaterThanOrEqual(0);
  expect(result.confidence).toBeLessThanOrEqual(1);
  expect(result.contributions).toEqual(expect.any(Array));
  expect(result.duration).toEqual(
    expect.objectContaining({
      movingMin: expect.any(Number),
      totalMin: expect.any(Number),
      lowMin: expect.any(Number),
      highMin: expect.any(Number),
    }),
  );
  expect(result.duration.lowMin).toBeLessThanOrEqual(result.duration.highMin);
  expect(result.challenges).toEqual(expect.any(Array));
  expect(result.recommendation).toEqual(expect.any(Object));
  expect(BANDS).toContain(result.band);
  expect(result.explanation).toEqual(
    expect.objectContaining({
      text: expect.any(String),
      source: expect.stringMatching(/^(template|llm)$/),
    }),
  );
}

describe("analyzeRoute", () => {
  it("computes distance and elevation for the short-climb fixture", () => {
    const result = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback" },
    });

    expect(result.status).toBe("ready");
    expectFullShape(result);
    expect(result.route.distanceKm).toBeGreaterThanOrEqual(
      SHORT_CLIMB_EXPECT.distanceKmMin,
    );
    expect(result.route.distanceKm).toBeLessThanOrEqual(
      SHORT_CLIMB_EXPECT.distanceKmMax,
    );
    expect(result.route.elevationGainM).toBeGreaterThanOrEqual(
      SHORT_CLIMB_EXPECT.elevationGainMMin,
    );
    expect(result.route.elevationGainM).toBeLessThanOrEqual(
      SHORT_CLIMB_EXPECT.elevationGainMMax,
    );
    expect(result.route.minElevM).toBe(80);
    expect(result.route.maxElevM).toBe(200);
    expect(result.segments.length).toBeGreaterThan(0);
    expect(
      result.segments.every(
        (s) =>
          typeof s.estimatedEffort === "number" &&
          s.effortLabel != null &&
          s.estimatedEffort >= 0,
      ),
    ).toBe(true);
    expect(result.elevationProfile.length).toBeGreaterThan(1);
    expect(result.baseDifficulty.overall).toBeGreaterThan(0);
    expect(result.baseDifficulty.climbing).toBeGreaterThan(
      result.baseDifficulty.endurance,
    );
  });

  it("still returns a complete RouteAnalysis for empty points and default profile", () => {
    const result = analyzeRoute({
      points: [],
      weather: { source: "fallback" },
    });

    expect(result.status).toBe("stub");
    expectFullShape(result);
    expect(result.route.center).toEqual({ lat: 0, lon: 0 });
  });

  it("uses finer segments for short routes than long routes", () => {
    const short = analyzeRoute({ points: SHORT_CLIMB_POINTS });
    const longPoints = Array.from({ length: 80 }, (_, i) => ({
      lat: 40 + i * 0.003,
      lon: 116,
      ele: 100 + (i % 5) * 10,
    }));
    const long = analyzeRoute({ points: longPoints });

    expect(short.route.distanceKm).toBeLessThan(6);
    expect(long.route.distanceKm).toBeGreaterThan(20);
    const shortTarget = short.segments[0]?.distanceM ?? 0;
    const longTarget = long.segments[0]?.distanceM ?? 0;
    expect(shortTarget).toBeLessThan(longTarget);
  });
});
