import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { SHORT_CLIMB_POINTS } from "./fixtures/shortClimb.points";

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
    // weatherMultiplier for this snapshot is about 3×; double-counting used to
    // push duration near 3.5×+. Cap growth to the multiplier band only.
    const ratio = harsh.duration.totalMin / mild.duration.totalMin;
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThanOrEqual(3.2);
    expect(harsh.personalDifficulty.overall).toBeGreaterThan(
      mild.personalDifficulty.overall,
    );
  });
});
