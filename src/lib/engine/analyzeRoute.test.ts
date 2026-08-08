import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";

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
  it("returns a stub RouteAnalysis with the stable public shape", () => {
    const result = analyzeRoute({
      points: [
        { lat: 40.0, lon: 116.0, ele: 100 },
        { lat: 40.01, lon: 116.01, ele: 180 },
      ],
      profile: { experience: "intermediate" },
      weather: { source: "fallback" },
    });

    expect(result.status).toBe("stub");
    expectFullShape(result);
  });

  it("still returns a complete RouteAnalysis for empty points and default profile", () => {
    const result = analyzeRoute({
      points: [],
      weather: { source: "fallback" },
    });

    expectFullShape(result);
    expect(result.route.center).toEqual({ lat: 0, lon: 0 });
  });
});
