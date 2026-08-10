import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createSample,
  deleteSample,
  listPublicSamples,
  updateSample,
} from "./store";

const MINI_GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="40" lon="116"><ele>10</ele></trkpt>
  <trkpt lat="40.01" lon="116.01"><ele>80</ele></trkpt>
  <trkpt lat="40.02" lon="116.02"><ele>120</ele></trkpt>
</trkseg></trk></gpx>`;

describe("samples store", () => {
  let dir: string;
  let prev: string | undefined;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "oc-samples-"));
    prev = process.env.SAMPLES_DATA_DIR;
    process.env.SAMPLES_DATA_DIR = dir;
    // Empty writable dir — no seed copy required for unit create/delete.
    await fs.writeFile(
      path.join(dir, "manifest.json"),
      JSON.stringify({ version: 1, samples: [] }, null, 2),
    );
  });

  afterEach(async () => {
    if (prev === undefined) delete process.env.SAMPLES_DATA_DIR;
    else process.env.SAMPLES_DATA_DIR = prev;
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("creates, lists, updates, and deletes a sample", async () => {
    const created = await createSample({
      name: "测试岭",
      region: "北京",
      blurb: "单元测试线",
      xml: MINI_GPX,
    });
    expect(created.id).toBeTruthy();
    expect(created.format).toBe("gpx");
    expect(created.stats).toMatch(/km/);

    const listed = await listPublicSamples();
    expect(listed).toHaveLength(1);
    expect(listed[0].file).toContain(`/api/samples/${created.id}/track`);

    const updated = await updateSample(created.id, {
      name: "测试岭·改",
      blurb: "已更新",
    });
    expect(updated.name).toBe("测试岭·改");

    await deleteSample(created.id);
    expect(await listPublicSamples()).toHaveLength(0);
  });
});
