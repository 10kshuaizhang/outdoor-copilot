import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { coordsTextToPoints, parseKml } from "./parseKml";

const LINESTRING_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>测试岭</name>
      <LineString>
        <coordinates>
          116.0000,40.0000,100
          116.0010,40.0010,140
          116.0020,40.0020,180
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

const GX_TRACK_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Placemark>
    <gx:Track>
      <gx:coord>116.0 40.0 50</gx:coord>
      <gx:coord>116.01 40.01 80</gx:coord>
      <gx:coord>116.02 40.02 110</gx:coord>
    </gx:Track>
  </Placemark>
</kml>`;

describe("parseKml", () => {
  it("parses LineString lon,lat,ele coordinates", () => {
    const points = parseKml(LINESTRING_KML);
    expect(points.length).toBe(3);
    expect(points[0]).toEqual({ lat: 40, lon: 116, ele: 100 });
    expect(points[2]?.ele).toBe(180);
  });

  it("parses gx:Track coords", () => {
    const points = parseKml(GX_TRACK_KML);
    expect(points.length).toBe(3);
    expect(points[0]).toEqual({ lat: 40, lon: 116, ele: 50 });
  });

  it("ignores invalid lat/lon", () => {
    const points = coordsTextToPoints("999,40 116,40 116,91");
    expect(points).toEqual([{ lat: 40, lon: 116, ele: undefined }]);
  });

  it("does not teleport-join distant LineStrings (uses longest continuous)", () => {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>short spur</name>
      <LineString>
        <coordinates>
          116.0000,40.0000,100
          116.0005,40.0005,110
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>main trail</name>
      <LineString>
        <coordinates>
          116.5000,40.5000,200
          116.5010,40.5010,220
          116.5020,40.5020,240
          116.5030,40.5030,260
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
    const points = parseKml(kml);
    expect(points.length).toBe(4);
    expect(points[0]?.lon).toBeCloseTo(116.5, 3);
    // Joining would invent a ~70 km jump; longest ring stays local.
    const result = analyzeRoute({
      points,
      weather: { source: "fallback" },
    });
    expect(result.route.distanceKm).toBeLessThan(5);
  });
});
