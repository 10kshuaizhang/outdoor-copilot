import { isElevationSpike } from "./grade";
import type { TrackPoint } from "./types";

const EARTH_RADIUS_M = 6371000;

/**
 * Minimum |Δh| from the last committed altitude before counting gain/loss.
 * Suppresses GPS/barometer micro-jitter that otherwise inflates cumulative climb
 * on dense tracks (e.g. Xiaowutai raw sum ~3300 m → ~2100 m).
 */
export const ELEVATION_HYSTERESIS_M = 5;

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

export type ElevHysteresisState = {
  anchorM: number;
  gainM: number;
  lossM: number;
};

export function startElevHysteresis(eleM: number): ElevHysteresisState {
  return { anchorM: eleM, gainM: 0, lossM: 0 };
}

/** Commit climb/descent only after moving ≥ threshold from the last anchor. */
export function pushElevHysteresis(
  state: ElevHysteresisState,
  eleM: number,
  thresholdM: number = ELEVATION_HYSTERESIS_M,
): void {
  const delta = eleM - state.anchorM;
  if (delta >= thresholdM) {
    state.gainM += delta;
    state.anchorM = eleM;
  } else if (delta <= -thresholdM) {
    state.lossM += -delta;
    state.anchorM = eleM;
  }
}

export function elevationStats(points: TrackPoint[]): {
  gainM: number;
  lossM: number;
  minElevM: number;
  maxElevM: number;
} {
  let minElevM = Number.POSITIVE_INFINITY;
  let maxElevM = Number.NEGATIVE_INFINITY;
  let hyst: ElevHysteresisState | null = null;
  let prevWithEle: TrackPoint | undefined;

  for (const p of points) {
    if (p.ele == null || Number.isNaN(p.ele)) continue;

    if (prevWithEle?.ele != null) {
      const dist = haversineMeters(prevWithEle, p);
      const stepDelta = p.ele - prevWithEle.ele;
      if (isElevationSpike(stepDelta, dist)) {
        // Drop the spike sample entirely; keep previous elev as the chain tip.
        continue;
      }
    }

    minElevM = Math.min(minElevM, p.ele);
    maxElevM = Math.max(maxElevM, p.ele);

    if (!hyst) {
      hyst = startElevHysteresis(p.ele);
    } else {
      pushElevHysteresis(hyst, p.ele);
    }
    prevWithEle = p;
  }

  if (!Number.isFinite(minElevM) || !hyst) {
    return { gainM: 0, lossM: 0, minElevM: 0, maxElevM: 0 };
  }
  return {
    gainM: hyst.gainM,
    lossM: hyst.lossM,
    minElevM,
    maxElevM,
  };
}

export function routeCenter(points: TrackPoint[]): { lat: number; lon: number } {
  if (points.length === 0) return { lat: 0, lon: 0 };
  const mid = points[Math.floor(points.length / 2)];
  return { lat: mid.lat, lon: mid.lon };
}
