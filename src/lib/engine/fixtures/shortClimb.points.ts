import type { TrackPoint } from "../types";

/**
 * Synthetic northbound climb used as an independent fixture.
 * ~1.00 km horizontal (0.009° latitude ≈ 1001.9 m at mid-latitudes),
 * +120 m elevation gain, no loss.
 */
export const SHORT_CLIMB_POINTS: TrackPoint[] = [
  { lat: 40.0, lon: 116.0, ele: 80 },
  { lat: 40.0015, lon: 116.0, ele: 100 },
  { lat: 40.003, lon: 116.0, ele: 125 },
  { lat: 40.0045, lon: 116.0, ele: 150 },
  { lat: 40.006, lon: 116.0, ele: 170 },
  { lat: 40.0075, lon: 116.0, ele: 185 },
  { lat: 40.009, lon: 116.0, ele: 200 },
];

export const SHORT_CLIMB_EXPECT = {
  distanceKmMin: 0.95,
  distanceKmMax: 1.05,
  elevationGainMMin: 115,
  elevationGainMMax: 125,
};
