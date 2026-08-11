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

  it("scores a ~10 km / 500 m day hike harder for beginner comfort than intermediate", () => {
    const points = Array.from({ length: 80 }, (_, i) => ({
      lat: 40 + i * 0.0011,
      lon: 116,
      ele: 100 + (i < 40 ? i * 12 : 480 - (i - 40) * 10),
    }));
    const beginner = analyzeRoute({
      points,
      profile: {
        experience: "beginner",
        comfortableDistanceKm: 10,
        comfortableElevationM: 500,
        riskPreference: "balanced",
      },
      weather: { source: "fallback", temperatureC: 18 },
    });
    const intermediate = analyzeRoute({
      points,
      profile: {
        experience: "intermediate",
        comfortableDistanceKm: 15,
        comfortableElevationM: 800,
        riskPreference: "balanced",
      },
      weather: { source: "fallback", temperatureC: 18 },
    });
    expect(beginner.route.distanceKm).toBeGreaterThan(8);
    expect(beginner.route.distanceKm).toBeLessThan(14);
    expect(beginner.personalDifficulty.overall).toBeGreaterThan(
      intermediate.personalDifficulty.overall,
    );
    expect(beginner.band).not.toBe("轻松");
  });
});
