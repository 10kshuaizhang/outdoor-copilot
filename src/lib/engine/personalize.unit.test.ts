import { describe, expect, it } from "vitest";
import {
  CAPABILITY_DISTANCE_ANCHOR_KM,
  CAPABILITY_ELEVATION_ANCHOR_M,
  COMFORT_BY_EXPERIENCE,
  COMFORT_DISTANCE_MAX_KM,
  COMFORT_ELEVATION_MAX_M,
  capabilityFromProfile,
  resolveProfile,
} from "./personalize";

describe("comfort scale constants", () => {
  it("allows professional day-hike comfort up to 40 km / 2500 m", () => {
    expect(COMFORT_DISTANCE_MAX_KM).toBe(40);
    expect(COMFORT_ELEVATION_MAX_M).toBe(2500);
  });

  it("uses capability anchors above weekend saturation", () => {
    expect(CAPABILITY_DISTANCE_ANCHOR_KM).toBe(30);
    expect(CAPABILITY_ELEVATION_ANCHOR_M).toBe(1800);
  });

  it("treats 10 km / 500 m as the beginner comfort preset", () => {
    expect(COMFORT_BY_EXPERIENCE.beginner).toEqual({
      distanceKm: 10,
      elevationM: 500,
    });
    expect(COMFORT_BY_EXPERIENCE.intermediate.distanceKm).toBeGreaterThan(10);
    expect(COMFORT_BY_EXPERIENCE.intermediate.elevationM).toBeGreaterThan(500);
  });
});

describe("resolveProfile defaults", () => {
  it("defaults missing profile to beginner comfort (10 km / 500 m)", () => {
    const profile = resolveProfile(undefined);
    expect(profile.experience).toBe("beginner");
    expect(profile.comfortableDistanceKm).toBe(10);
    expect(profile.comfortableElevationM).toBe(500);
    expect(profile.usedDefaults).toBe(true);
  });
});

describe("capabilityFromProfile scale", () => {
  it("keeps differentiating above the old 18 km / 1000 m ceiling", () => {
    const mid = capabilityFromProfile({
      experience: "expert",
      comfortableDistanceKm: 18,
      comfortableElevationM: 1000,
      riskPreference: "balanced",
    });
    const pro = capabilityFromProfile({
      experience: "expert",
      comfortableDistanceKm: 40,
      comfortableElevationM: 2500,
      riskPreference: "balanced",
    });
    expect(pro.flatEndurance).toBeGreaterThan(mid.flatEndurance);
    expect(pro.climbing).toBeGreaterThan(mid.climbing);
  });
});
