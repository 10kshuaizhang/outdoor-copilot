import { describe, expect, it } from "vitest";
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
});
