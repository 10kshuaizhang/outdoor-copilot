import { describe, expect, it } from "vitest";
import {
  estimateSegmentEffort,
  findHardestStretch,
  labelSegmentEffort,
  enrichSegmentEffort,
} from "./effort";
import { buildSegments } from "./segments";
import type { TrackPoint } from "./types";

describe("estimateSegmentEffort", () => {
  it("rises with climb and steep grade without using overall score inputs", () => {
    const flat = estimateSegmentEffort({
      distanceM: 500,
      gainM: 5,
      lossM: 5,
      avgGradePct: 0,
      maxGradePct: 2,
    });
    const climb = estimateSegmentEffort({
      distanceM: 500,
      gainM: 80,
      lossM: 0,
      avgGradePct: 16,
      maxGradePct: 24,
    });
    expect(climb).toBeGreaterThan(flat * 1.5);
  });
});

describe("labelSegmentEffort", () => {
  it("labels descent / hard climb / easy", () => {
    expect(
      labelSegmentEffort({
        distanceM: 400,
        gainM: 0,
        lossM: 60,
        avgGradePct: -12,
        maxGradePct: 14,
        estimatedEffort: 0.4,
      }),
    ).toBe("descent");

    expect(
      labelSegmentEffort({
        distanceM: 400,
        gainM: 70,
        lossM: 0,
        avgGradePct: 14,
        maxGradePct: 22,
        estimatedEffort: 2.2,
      }),
    ).toBe("hard_climb");

    expect(
      labelSegmentEffort({
        distanceM: 500,
        gainM: 8,
        lossM: 6,
        avgGradePct: 0.4,
        maxGradePct: 6,
        estimatedEffort: 0.6,
      }),
    ).toBe("easy");
  });
});

describe("findHardestStretch", () => {
  it("points at the peak-effort climb region", () => {
    const points: TrackPoint[] = [];
    // Flat warm-up
    for (let i = 0; i < 20; i++) {
      points.push({ lat: 40, lon: 116 + i * 0.0003, ele: 100 });
    }
    // Hard climb
    for (let i = 0; i < 25; i++) {
      points.push({
        lat: 40 + i * 0.0002,
        lon: 116.006,
        ele: 100 + i * 12,
      });
    }
    // Descent
    for (let i = 0; i < 20; i++) {
      points.push({
        lat: 40.005 + i * 0.0002,
        lon: 116.006,
        ele: 400 - i * 10,
      });
    }

    const segments = buildSegments(points);
    expect(segments.every((s) => s.estimatedEffort >= 0)).toBe(true);
    expect(segments.every((s) => s.effortLabel)).toBeTruthy();

    const hardest = findHardestStretch(segments);
    expect(hardest).not.toBeNull();
    expect(hardest!.gainM).toBeGreaterThan(50);
    expect(hardest!.endKm).toBeGreaterThan(hardest!.startKm);
  });

  it("ignores GPS elevation spikes that invent 2000% grades", () => {
    const points: TrackPoint[] = [];
    for (let i = 0; i < 30; i++) {
      points.push({ lat: 40, lon: 116 + i * 0.00025, ele: 200 + i * 2 });
    }
    // Real sustained climb
    for (let i = 0; i < 40; i++) {
      points.push({
        lat: 40.001 + i * 0.0002,
        lon: 116.008,
        ele: 260 + i * 8,
      });
    }
    // Descent with one absurd GPS spike (same lat/lon drift tiny, +80m jump)
    for (let i = 0; i < 25; i++) {
      const spike = i === 5;
      points.push({
        lat: 40.01 + i * 0.00015,
        lon: 116.008,
        ele: spike ? 700 : 500 - i * 6,
      });
    }

    const segments = buildSegments(points);
    expect(Math.max(...segments.map((s) => s.maxGradePct))).toBeLessThanOrEqual(
      45,
    );

    const hardest = findHardestStretch(segments);
    expect(hardest).not.toBeNull();
    expect(hardest!.label).not.toBe("descent");
    expect(hardest!.peakSegment.maxGradePct).toBeLessThanOrEqual(45);
    expect(hardest!.gainM).toBeGreaterThan(80);
  });
});

describe("enrichSegmentEffort", () => {
  it("is deterministic for the same geometry", () => {
    const a = enrichSegmentEffort({
      idx: 0,
      startKm: 1,
      endKm: 1.3,
      distanceM: 300,
      gainM: 40,
      lossM: 0,
      avgGradePct: 13,
      maxGradePct: 18,
    });
    const b = enrichSegmentEffort({
      idx: 0,
      startKm: 1,
      endKm: 1.3,
      distanceM: 300,
      gainM: 40,
      lossM: 0,
      avgGradePct: 13,
      maxGradePct: 18,
    });
    expect(a).toEqual(b);
  });
});
