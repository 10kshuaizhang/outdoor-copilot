import type { TrackPoint } from "./types";

/**
 * Minimal GPX track parser (trkpt / rtept). No XML dependency for V0.1.
 */
export function parseGpx(xml: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  const re =
    /<(?:trkpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    const latM = /\blat=["']([-0-9.]+)["']/.exec(attrs);
    const lonM = /\blon=["']([-0-9.]+)["']/.exec(attrs);
    if (!latM || !lonM) continue;
    const eleM = /<ele>\s*([-0-9.]+)\s*<\/ele>/i.exec(body);
    points.push({
      lat: Number(latM[1]),
      lon: Number(lonM[1]),
      ele: eleM ? Number(eleM[1]) : undefined,
    });
  }
  return points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon),
  );
}

export function pointsToGpx(
  points: TrackPoint[],
  name: string,
): string {
  const trkpts = points
    .map((p) => {
      const ele = p.ele != null ? `<ele>${p.ele}</ele>` : "";
      return `<trkpt lat="${p.lat}" lon="${p.lon}">${ele}</trkpt>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Outdoor Copilot">
  <trk><name>${name}</name><trkseg>${trkpts}</trkseg></trk>
</gpx>`;
}
