import { describe, expect, it } from "vitest";
import {
  applyPhysiologyToScores,
  estimatePhysiologicalLoad,
} from "./physiology";

describe("physiology score gating", () => {
  it("does not move scores when body metrics are defaulted", () => {
    const scores = {
      overall: 40,
      endurance: 40,
      climbing: 35,
      weather: 42,
      risk: 20,
    };
    const physio = estimatePhysiologicalLoad({
      distanceM: 12000,
      elevationGainM: 800,
      durationMin: 300,
      profile: { experience: "intermediate" },
    });
    expect(physio.usedDefaults).toBe(true);
    const applied = applyPhysiologyToScores(scores, physio);
    expect(applied.scores).toEqual(scores);
    expect(applied.contributions).toHaveLength(0);
  });

  it("applies pack weight when explicitly set even without HR", () => {
    const scores = {
      overall: 40,
      endurance: 40,
      climbing: 35,
      weather: 42,
      risk: 20,
    };
    const physio = estimatePhysiologicalLoad({
      distanceM: 12000,
      elevationGainM: 800,
      durationMin: 300,
      profile: { packWeightKg: 12 },
    });
    expect(physio.packExplicit).toBe(true);
    const applied = applyPhysiologyToScores(scores, physio);
    expect(applied.scores.climbing).toBeGreaterThan(scores.climbing);
    expect(applied.contributions.length).toBeGreaterThan(0);
  });

  it("applies reserve-load nudge when body metrics are provided", () => {
    const scores = {
      overall: 40,
      endurance: 40,
      climbing: 35,
      weather: 42,
      risk: 20,
    };
    const physio = estimatePhysiologicalLoad({
      distanceM: 20000,
      elevationGainM: 1500,
      durationMin: 480,
      profile: {
        heightCm: 175,
        weightKg: 70,
        restingHr: 58,
        packWeightKg: 6,
      },
    });
    expect(physio.usedDefaults).toBe(false);
    const applied = applyPhysiologyToScores(scores, physio);
    expect(
      applied.scores.endurance + applied.scores.climbing,
    ).toBeGreaterThan(scores.endurance + scores.climbing);
  });
});
