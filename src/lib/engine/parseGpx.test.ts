import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { parseGpx } from "./parseGpx";

describe("parseGpx", () => {
  it("parses the beijing sample into a ready base analysis", () => {
    const xml = readFileSync(
      path.resolve(import.meta.dirname, "../../../public/samples/beijing-steep.gpx"),
      "utf8",
    );
    const points = parseGpx(xml);
    expect(points.length).toBeGreaterThan(50);

    const result = analyzeRoute({ points, weather: { source: "fallback" } });
    expect(result.status).toBe("ready");
    expect(result.route.distanceKm).toBeGreaterThan(5);
    expect(result.route.elevationGainM).toBeGreaterThan(400);
    expect(result.segments.length).toBeGreaterThan(5);
    expect(result.elevationProfile.length).toBeGreaterThan(5);
    expect(result.baseDifficulty.overall).toBeGreaterThan(30);
  });
});
