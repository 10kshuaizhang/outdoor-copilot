import { describe, expect, it } from "vitest";
import { TIPS } from "./tipCopy";

describe("tipCopy", () => {
  it("keeps P0/P1 tips non-empty and formula-free", () => {
    const keys = [
      "scoreBand",
      "baseVsPersonal",
      "confidence",
      "axisPhysical",
      "axisIntensity",
      "axisEnvironment",
      "axisRisk",
      "contributions",
      "waterCarry",
      "waterConsume",
      "durationMoving",
      "elevGain",
      "maxElev",
      "difficultyProfile",
      "briefVerdict",
      "multiModel",
      "comfortDist",
      "comfortElev",
      "physioGrade",
    ] as const;
    for (const k of keys) {
      expect(TIPS[k].length).toBeGreaterThan(12);
      expect(TIPS[k]).not.toMatch(/Naismith|equivKm|hysteresis|overall\s*\*/i);
    }
  });
});
