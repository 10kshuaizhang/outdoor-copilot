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

  it("labels a comfort-zone day hike as 轻松 for an advanced profile", () => {
    // ~ fox-valley scale: ~10km / 550m inside a strong comfort zone
    const points = Array.from({ length: 60 }, (_, i) => ({
      lat: 40 + i * 0.0012,
      lon: 116,
      ele: 120 + Math.sin(i / 8) * 40 + (i < 25 ? i * 8 : 200 - (i - 25) * 5),
    }));
    const result = analyzeRoute({
      points,
      profile: {
        experience: "advanced",
        comfortableDistanceKm: 15,
        comfortableElevationM: 900,
        riskPreference: "balanced",
      },
      weather: { source: "fallback", temperatureC: 18 },
    });
    expect(result.route.distanceKm).toBeGreaterThan(5);
    expect(result.personalDifficulty.overall).toBeLessThan(36);
    expect(result.band).toBe("轻松");
  });
});
