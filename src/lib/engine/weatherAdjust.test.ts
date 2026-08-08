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
});
