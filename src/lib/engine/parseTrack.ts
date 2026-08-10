import { parseGpx } from "./parseGpx";
import { parseKml } from "./parseKml";
import type { TrackPoint } from "./types";

export type TrackFormat = "gpx" | "kml";

/** Sniff GPX vs KML from XML content (extension optional / unreliable on iOS). */
export function detectTrackFormat(xml: string): TrackFormat | null {
  const head = xml.slice(0, 8000);
  if (
    /<gpx[\s>]/i.test(head) ||
    /<(?:trkpt|rtept)\b/i.test(xml) ||
    (/<\?xml/i.test(head) && /<(?:trk|rte)\b/i.test(xml) && !/<kml[\s>]/i.test(head))
  ) {
    return "gpx";
  }
  if (
    /<kml[\s>]/i.test(head) ||
    /<(?:[\w.-]+:)?(?:LineString|LinearRing|Placemark)\b/i.test(xml) ||
    /<(?:[\w.-]+:)?(?:coord|gx:coord)\b/i.test(xml) ||
    (/<coordinates\b/i.test(xml) && /xmlns\s*=\s*["'][^"']*ogckml/i.test(head))
  ) {
    return "kml";
  }
  return null;
}

/** Parse trail XML after format detection. */
export function parseTrackXml(
  xml: string,
  format?: TrackFormat | null,
): TrackPoint[] {
  const kind = format ?? detectTrackFormat(xml);
  if (kind === "kml") return parseKml(xml);
  if (kind === "gpx") return parseGpx(xml);

  // Ambiguous: try both, prefer more points.
  const gpx = parseGpx(xml);
  const kml = parseKml(xml);
  return kml.length > gpx.length ? kml : gpx;
}
