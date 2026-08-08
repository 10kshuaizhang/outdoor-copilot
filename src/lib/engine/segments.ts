import { enrichSegmentEffort } from "./effort";
import { accumulateDistances, haversineMeters } from "./geo";
import { clampGradePct, isElevationSpike, stepGradePct } from "./grade";
import type { Segment, TrackPoint } from "./types";

export function targetSegmentLengthM(distanceKm: number): number {
  if (distanceKm < 6) return 100;
  if (distanceKm <= 20) return 250;
  return 500;
}

export function buildSegments(points: TrackPoint[]): Segment[] {
  if (points.length < 2) return [];

  const cum = accumulateDistances(points);
  const totalM = cum[cum.length - 1];
  const target = targetSegmentLengthM(totalM / 1000);
  const segments: Segment[] = [];

  let startIdx = 0;
  let segIdx = 0;

  for (let i = 1; i < points.length; i++) {
    const isLast = i === points.length - 1;
    const segDist = cum[i] - cum[startIdx];
    if (segDist < target && !isLast) continue;

    let gainM = 0;
    let lossM = 0;
    let maxGradePct = 0;
    for (let j = startIdx + 1; j <= i; j++) {
      const dist = haversineMeters(points[j - 1], points[j]);
      const eleA = points[j - 1].ele ?? 0;
      const eleB = points[j].ele ?? 0;
      const delta = eleB - eleA;
      // Skip gain/loss on spike steps so one bad point cannot invent "hardest".
      if (!isElevationSpike(delta, dist)) {
        if (delta > 0) gainM += delta;
        else lossM += -delta;
      }
      const grade = stepGradePct(delta, dist);
      if (grade != null) {
        maxGradePct = Math.max(maxGradePct, clampGradePct(grade));
      }
    }

    const distanceM = cum[i] - cum[startIdx];
    const avgGradePct = distanceM > 0 ? (gainM - lossM) / distanceM * 100 : 0;

    segments.push(
      enrichSegmentEffort({
        idx: segIdx,
        startKm: cum[startIdx] / 1000,
        endKm: cum[i] / 1000,
        distanceM,
        gainM,
        lossM,
        avgGradePct,
        maxGradePct,
      }),
    );

    segIdx += 1;
    startIdx = i;
  }

  return segments;
}
