import { haversineMeters } from "./geo";
import type { TrackPoint } from "./types";

/**
 * Parse KML trail geometry into track points.
 * Supports LineString / MultiGeometry coordinates and gx:Track coords.
 * KML order is lon,lat[,ele] — opposite of GPX lat/lon attributes.
 *
 * Multiple distant LineStrings are NOT stitched (that invents teleport km).
 * We keep the longest continuous ring by path length.
 */
export function parseKml(xml: string): TrackPoint[] {
  const fromLines = parseLineStringCoordinates(xml);
  if (fromLines.length >= 2) return fromLines;

  const fromTrack = parseGxTrack(xml);
  if (fromTrack.length >= 2) return fromTrack;

  // Last resort: ordered Point placemarks (rare for continuous trails).
  return parseOrderedPoints(xml);
}

function parseLineStringCoordinates(xml: string): TrackPoint[] {
  const rings: TrackPoint[][] = [];
  // Match coordinates blocks that sit under LineString / LinearRing.
  const blockRe =
    /<(?:[\w.-]+:)?(?:LineString|LinearRing)\b[^>]*>[\s\S]*?<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(xml))) {
    const chunk = filterPoints(coordsTextToPoints(match[1] ?? ""));
    if (chunk.length >= 2) rings.push(chunk);
  }

  // Some exporters put bare <coordinates> under Placemark without wrapping we matched.
  if (rings.length === 0) {
    const looseRe = /<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/gi;
    while ((match = looseRe.exec(xml))) {
      const chunk = filterPoints(coordsTextToPoints(match[1] ?? ""));
      if (chunk.length >= 2) rings.push(chunk);
    }
  }

  return pickLongestRing(rings);
}

function pathLengthMeters(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

/** Prefer the longest continuous geometry; never invent a jump between rings. */
export function pickLongestRing(rings: TrackPoint[][]): TrackPoint[] {
  if (rings.length === 0) return [];
  let best = rings[0];
  let bestLen = pathLengthMeters(best);
  for (let i = 1; i < rings.length; i++) {
    const len = pathLengthMeters(rings[i]);
    if (len > bestLen || (len === bestLen && rings[i].length > best.length)) {
      best = rings[i];
      bestLen = len;
    }
  }
  return best;
}

function parseGxTrack(xml: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  const coordRe =
    /<(?:[\w.-]+:)?coord\b[^>]*>\s*([-0-9.]+)\s+([-0-9.]+)(?:\s+([-0-9.]+))?\s*<\/(?:[\w.-]+:)?coord>/gi;
  let match: RegExpExecArray | null;
  while ((match = coordRe.exec(xml))) {
    const lon = Number(match[1]);
    const lat = Number(match[2]);
    const ele = match[3] != null ? Number(match[3]) : undefined;
    points.push({
      lat,
      lon,
      ele: ele != null && Number.isFinite(ele) ? ele : undefined,
    });
  }
  return filterPoints(points);
}

function parseOrderedPoints(xml: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  const pointRe =
    /<(?:[\w.-]+:)?Point\b[^>]*>[\s\S]*?<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>[\s\S]*?<\/(?:[\w.-]+:)?Point>/gi;
  let match: RegExpExecArray | null;
  while ((match = pointRe.exec(xml))) {
    const chunk = coordsTextToPoints(match[1] ?? "");
    if (chunk[0]) points.push(chunk[0]);
  }
  return filterPoints(points);
}

/** Parse space/newline-separated "lon,lat[,ele]" tuples. */
export function coordsTextToPoints(text: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  const cleaned = text.trim();
  if (!cleaned) return points;

  for (const token of cleaned.split(/[\s\n\r]+/)) {
    if (!token.includes(",")) continue;
    const parts = token.split(",");
    const lon = Number(parts[0]);
    const lat = Number(parts[1]);
    const eleRaw =
      parts[2] != null && parts[2] !== "" ? Number(parts[2]) : undefined;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    points.push({
      lat,
      lon,
      ele: eleRaw != null && Number.isFinite(eleRaw) ? eleRaw : undefined,
    });
  }
  return points;
}

function filterPoints(points: TrackPoint[]): TrackPoint[] {
  return points.filter(
    (p) =>
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lon) &&
      Math.abs(p.lat) <= 90 &&
      Math.abs(p.lon) <= 180,
  );
}
