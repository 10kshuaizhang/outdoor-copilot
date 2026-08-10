import { describe, expect, it } from "vitest";
import { readAndValidateTrackFile } from "./validateUpload";

function fileFrom(name: string, content: string, type = "application/octet-stream") {
  return new File([content], name, { type });
}

const MINIMAL_GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="40" lon="116"><ele>10</ele></trkpt>
  <trkpt lat="40.01" lon="116"><ele>40</ele></trkpt>
</trkseg></trk></gpx>`;

const MINIMAL_KML = `<?xml version="1.0"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <LineString>
      <coordinates>
        116.0,40.0,10
        116.01,40.01,40
      </coordinates>
    </LineString>
  </Placemark>
</kml>`;

describe("readAndValidateTrackFile", () => {
  it("rejects clearly non-track content even with .gpx name", async () => {
    const result = await readAndValidateTrackFile(
      fileFrom("route.gpx", "not a trail"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/无法识别|不像/);
  });

  it("rejects files without track points", async () => {
    const result = await readAndValidateTrackFile(
      fileFrom("empty.gpx", "<gpx><trk></trk></gpx>"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/轨迹点/);
  });

  it("accepts a minimal valid gpx", async () => {
    const result = await readAndValidateTrackFile(fileFrom("ok.gpx", MINIMAL_GPX));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.format).toBe("gpx");
  });

  it("accepts a minimal valid kml", async () => {
    const result = await readAndValidateTrackFile(fileFrom("ok.kml", MINIMAL_KML));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe("kml");
      expect(result.pointsCount).toBeGreaterThanOrEqual(2);
      expect(result.displayName).toBe("ok");
    }
  });

  it("accepts kml content even when extension is missing", async () => {
    const result = await readAndValidateTrackFile(
      fileFrom("周末路线", MINIMAL_KML),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.format).toBe("kml");
  });

  it("accepts gpx content even when iOS omits the .gpx extension", async () => {
    const result = await readAndValidateTrackFile(
      fileFrom("我的周末徒步", MINIMAL_GPX),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.displayName).toBe("我的周末徒步");
  });

  it("accepts utf-8 bom prefixed gpx", async () => {
    const result = await readAndValidateTrackFile(
      fileFrom("bom.gpx", `\uFEFF${MINIMAL_GPX}`),
    );
    expect(result.ok).toBe(true);
  });
});
