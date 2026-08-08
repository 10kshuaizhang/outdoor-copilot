import type { TrackPoint } from "./types";

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function accumulateDistances(points: TrackPoint[]): number[] {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + haversineMeters(points[i - 1], points[i]));
  }
  return distances;
}

export function elevationStats(points: TrackPoint[]): {
  gainM: number;
  lossM: number;
  minElevM: number;
  maxElevM: number;
} {
  let gainM = 0;
  let lossM = 0;
  let minElevM = Number.POSITIVE_INFINITY;
  let maxElevM = Number.NEGATIVE_INFINITY;
  let prev: number | undefined;

  for (const p of points) {
    if (p.ele == null || Number.isNaN(p.ele)) continue;
    minElevM = Math.min(minElevM, p.ele);
    maxElevM = Math.max(maxElevM, p.ele);
    if (prev != null) {
      const delta = p.ele - prev;
      if (delta > 0) gainM += delta;
      else lossM += -delta;
    }
    prev = p.ele;
  }

  if (!Number.isFinite(minElevM)) {
    return { gainM: 0, lossM: 0, minElevM: 0, maxElevM: 0 };
  }
  return { gainM, lossM, minElevM, maxElevM };
}

export function routeCenter(points: TrackPoint[]): { lat: number; lon: number } {
  if (points.length === 0) return { lat: 0, lon: 0 };
  const mid = points[Math.floor(points.length / 2)];
  return { lat: mid.lat, lon: mid.lon };
}
