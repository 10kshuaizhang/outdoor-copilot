import { describe, expect, it } from "vitest";
import { readAndValidateGpxFile } from "./validateUpload";

function fileFrom(name: string, content: string, type = "application/gpx+xml") {
  return new File([content], name, { type });
}

describe("readAndValidateGpxFile", () => {
  it("rejects non-gpx extensions", async () => {
    const result = await readAndValidateGpxFile(
      fileFrom("route.txt", "<gpx></gpx>"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/\.gpx/);
  });

  it("rejects files without track points", async () => {
    const result = await readAndValidateGpxFile(
      fileFrom("empty.gpx", "<gpx><trk></trk></gpx>"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/轨迹点/);
  });

  it("accepts a minimal valid gpx", async () => {
    const xml = `<?xml version="1.0"?>
      <gpx><trk><trkseg>
        <trkpt lat="40" lon="116"><ele>10</ele></trkpt>
        <trkpt lat="40.01" lon="116"><ele>40</ele></trkpt>
      </trkseg></trk></gpx>`;
    const result = await readAndValidateGpxFile(fileFrom("ok.gpx", xml));
    expect(result.ok).toBe(true);
  });
});
