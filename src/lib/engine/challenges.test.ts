import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { parseGpx } from "./parseGpx";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("challenges", () => {
  it("keeps challenge kilometer ranges inside the route length", () => {
    const xml = readFileSync(
      path.resolve(import.meta.dirname, "../../../public/samples/beijing-steep.gpx"),
      "utf8",
    );
    const result = analyzeRoute({
      points: parseGpx(xml),
      weather: { source: "fallback", temperatureC: 30 },
    });
    for (const c of result.challenges) {
      expect(c.startKm).toBeGreaterThanOrEqual(0);
      expect(c.endKm).toBeLessThanOrEqual(result.route.distanceKm + 0.05);
      expect(c.endKm).toBeGreaterThanOrEqual(c.startKm);
    }
  });
});
