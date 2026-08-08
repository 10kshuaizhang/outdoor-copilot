import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { SHORT_CLIMB_POINTS } from "./fixtures/shortClimb.points";

describe("physiological hybrid layer", () => {
  it("raises personal difficulty when pack weight increases", () => {
    const light = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: {
        experience: "intermediate",
        heightCm: 170,
        weightKg: 65,
        restingHr: 70,
        packWeightKg: 3,
      },
      weather: { source: "fallback" },
    });
    const heavy = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: {
        experience: "intermediate",
        heightCm: 170,
        weightKg: 65,
        restingHr: 70,
        packWeightKg: 12,
      },
      weather: { source: "fallback" },
    });

    expect(heavy.personalDifficulty.overall).toBeGreaterThanOrEqual(
      light.personalDifficulty.overall,
    );
    expect(heavy.personalDifficulty.climbing).toBeGreaterThanOrEqual(
      light.personalDifficulty.climbing,
    );
  });
});
