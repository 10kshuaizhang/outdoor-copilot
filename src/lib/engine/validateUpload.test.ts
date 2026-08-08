import { describe, expect, it } from "vitest";
import { readAndValidateGpxFile } from "./validateUpload";

function fileFrom(name: string, content: string, type = "application/octet-stream") {
  return new File([content], name, { type });
}

const MINIMAL_GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="40" lon="116"><ele>10</ele></trkpt>
  <trkpt lat="40.01" lon="116"><ele>40</ele></trkpt>
</trkseg></trk></gpx>`;

describe("readAndValidateGpxFile", () => {
  it("rejects clearly non-gpx content even with .gpx name", async () => {
    const result = await readAndValidateGpxFile(
      fileFrom("route.gpx", "not a trail"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/无法识别|不像 GPX/);
  });

  it("rejects files without track points", async () => {
    const result = await readAndValidateGpxFile(
      fileFrom("empty.gpx", "<gpx><trk></trk></gpx>"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/轨迹点/);
  });

  it("accepts a minimal valid gpx", async () => {
    const result = await readAndValidateGpxFile(fileFrom("ok.gpx", MINIMAL_GPX));
    expect(result.ok).toBe(true);
  });

  it("accepts gpx content even when iOS omits the .gpx extension", async () => {
    const result = await readAndValidateGpxFile(
      fileFrom("我的周末徒步", MINIMAL_GPX),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.displayName).toBe("我的周末徒步");
  });

  it("accepts utf-8 bom prefixed gpx", async () => {
    const result = await readAndValidateGpxFile(
      fileFrom("bom.gpx", `\uFEFF${MINIMAL_GPX}`),
    );
    expect(result.ok).toBe(true);
  });
});
