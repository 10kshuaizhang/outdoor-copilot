import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";

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
    expect(result.route).toEqual(
      expect.objectContaining({
        distanceKm: expect.any(Number),
        elevationGainM: expect.any(Number),
        center: expect.objectContaining({
          lat: expect.any(Number),
          lon: expect.any(Number),
        }),
      }),
    );
    expect(result.baseDifficulty.overall).toEqual(expect.any(Number));
    expect(result.personalDifficulty.overall).toEqual(expect.any(Number));
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.contributions).toEqual(expect.any(Array));
    expect(result.duration.lowMin).toBeLessThanOrEqual(result.duration.highMin);
    expect(result.challenges).toEqual(expect.any(Array));
    expect(result.band).toEqual(expect.any(String));
    expect(result.explanation.source).toBe("template");
  });
});
