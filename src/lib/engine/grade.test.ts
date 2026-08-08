import { describe, expect, it } from "vitest";
import { clampGradePct, stepGradePct } from "./grade";

describe("stepGradePct", () => {
  it("rejects micro-distance and spike steps", () => {
    expect(stepGradePct(20, 2)).toBeNull();
    expect(stepGradePct(80, 10)).toBeNull();
  });

  it("accepts a plausible steep step", () => {
    const g = stepGradePct(20, 100);
    expect(g).toBeCloseTo(20, 5);
  });
});

describe("clampGradePct", () => {
  it("caps absurd magnitudes", () => {
    expect(clampGradePct(2243.6)).toBe(45);
    expect(clampGradePct(-18)).toBe(18);
  });
});
