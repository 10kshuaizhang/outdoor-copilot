import { enrichSegmentEffort } from "./effort";
import {
  accumulateDistances,
  haversineMeters,
  pushElevHysteresis,
  startElevHysteresis,
  type ElevHysteresisState,
} from "./geo";
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
  // One hysteresis chain for the whole route so segment gains align with route stats.
  let hyst: ElevHysteresisState | null = null;
  let lastEle: number | undefined =
    points[0].ele != null && !Number.isNaN(points[0].ele)
      ? points[0].ele
      : undefined;
  if (lastEle != null) hyst = startElevHysteresis(lastEle);

  for (let i = 1; i < points.length; i++) {
    const isLast = i === points.length - 1;
    const segDist = cum[i] - cum[startIdx];
    if (segDist < target && !isLast) continue;

    let gainM = 0;
    let lossM = 0;
    let maxGradePct = 0;
    for (let j = startIdx + 1; j <= i; j++) {
      const dist = haversineMeters(points[j - 1], points[j]);
      const eleA = points[j - 1].ele;
      const eleB = points[j].ele;
      const rawA = eleA ?? lastEle ?? 0;
      const rawB = eleB ?? rawA;
      const delta = rawB - rawA;
      const grade = stepGradePct(delta, dist);
      if (grade != null) {
        maxGradePct = Math.max(maxGradePct, clampGradePct(grade));
      }

      if (eleB == null || Number.isNaN(eleB)) continue;
      if (isElevationSpike(delta, dist)) continue;

      if (!hyst) {
        hyst = startElevHysteresis(eleB);
        lastEle = eleB;
        continue;
      }
      const beforeGain = hyst.gainM;
      const beforeLoss = hyst.lossM;
      pushElevHysteresis(hyst, eleB);
      gainM += hyst.gainM - beforeGain;
      lossM += hyst.lossM - beforeLoss;
      lastEle = eleB;
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
