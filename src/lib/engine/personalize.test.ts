import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { SHORT_CLIMB_POINTS } from "./fixtures/shortClimb.points";

describe("analyzeRoute personalization", () => {
  it("does not raise personalOverall when the profile is stronger", () => {
    const weaker = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: {
        experience: "beginner",
        comfortableDistanceKm: 6,
        comfortableElevationM: 200,
        riskPreference: "conservative",
      },
      weather: { source: "fallback" },
    });

    const stronger = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: {
        experience: "expert",
        comfortableDistanceKm: 20,
        comfortableElevationM: 1200,
        riskPreference: "aggressive",
      },
      weather: { source: "fallback" },
    });

    expect(stronger.personalDifficulty.overall).toBeLessThanOrEqual(
      weaker.personalDifficulty.overall,
    );
    expect(stronger.confidence).toBeGreaterThanOrEqual(weaker.confidence);
  });

  it("keeps base difficulty unchanged across profiles", () => {
    const a = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "beginner" },
    });
    const b = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "expert" },
    });
    expect(a.baseDifficulty.overall).toBe(b.baseDifficulty.overall);
  });
});
