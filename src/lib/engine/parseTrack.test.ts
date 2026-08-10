import { describe, expect, it } from "vitest";
import { detectTrackFormat, parseTrackXml } from "./parseTrack";

const GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="40" lon="116"><ele>10</ele></trkpt>
  <trkpt lat="40.01" lon="116"><ele>40</ele></trkpt>
</trkseg></trk></gpx>`;

const KML = `<?xml version="1.0"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark><LineString><coordinates>
    116.0,40.0,10 116.01,40.01,40
  </coordinates></LineString></Placemark>
</kml>`;

describe("detectTrackFormat", () => {
  it("detects gpx and kml", () => {
    expect(detectTrackFormat(GPX)).toBe("gpx");
    expect(detectTrackFormat(KML)).toBe("kml");
    expect(detectTrackFormat("hello")).toBeNull();
  });
});

describe("parseTrackXml", () => {
  it("routes to the right parser", () => {
    expect(parseTrackXml(GPX).length).toBe(2);
    expect(parseTrackXml(KML)[0]).toMatchObject({ lat: 40, lon: 116 });
  });
});
