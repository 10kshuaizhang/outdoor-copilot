import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { elevationStats } from "./geo";
import type { TrackPoint } from "./types";

describe("elevationStats hysteresis", () => {
  it("preserves clean monotonic climbs", () => {
    const points: TrackPoint[] = [
      { lat: 40, lon: 116, ele: 80 },
      { lat: 40.001, lon: 116, ele: 100 },
      { lat: 40.002, lon: 116, ele: 125 },
      { lat: 40.003, lon: 116, ele: 150 },
      { lat: 40.004, lon: 116, ele: 200 },
    ];
    const stats = elevationStats(points);
    expect(stats.gainM).toBe(120);
    expect(stats.lossM).toBe(0);
  });

  it("does not double-count barometer micro-jitter on a true climb", () => {
    // True +100 m climb with ±1.5 m alternating noise every sample.
    const points: TrackPoint[] = Array.from({ length: 101 }, (_, i) => ({
      lat: 40 + i * 0.0001,
      lon: 116,
      ele: 100 + i + (i % 2 === 0 ? 1.5 : -1.5),
    }));
    const stats = elevationStats(points);
    expect(stats.gainM).toBeGreaterThanOrEqual(90);
    expect(stats.gainM).toBeLessThanOrEqual(115);
    // Unfiltered sum of positive steps is ~200 m.
    expect(stats.gainM).toBeLessThan(150);
  });

  it("cuts GPS jitter on the Xiaowutai east-north loop fixture", () => {
    const raw = JSON.parse(
      readFileSync(
        path.resolve(import.meta.dirname, "fixtures/xiaowutai.points.json"),
        "utf8",
      ),
    ) as TrackPoint[];
    const stats = elevationStats(raw);
    expect(stats.maxElevM).toBeGreaterThanOrEqual(2850);
    expect(stats.maxElevM).toBeLessThanOrEqual(2900);
    // Unfiltered gain was ~3314 m; realistic cumulative is ~2.0–2.4 km.
    expect(stats.gainM).toBeGreaterThanOrEqual(1900);
    expect(stats.gainM).toBeLessThanOrEqual(2400);
  });
});
