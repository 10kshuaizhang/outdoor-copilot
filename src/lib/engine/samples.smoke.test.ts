import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseGpx } from "./parseGpx";
import { analyzeRoute } from "./analyzeRoute";
import type { UserProfile } from "./types";

const profile: UserProfile = {
  experience: "intermediate",
  comfortableDistanceKm: 15,
  comfortableElevationM: 800,
  riskPreference: "balanced",
};

const samples = [
  "daheifeng.gpx",
  "haituoshan.gpx",
  "yangtaishan-miaofengshan.gpx",
] as const;

describe("real sample routes", () => {
  for (const file of samples) {
    it(`analyzes ${file}`, () => {
      const xml = readFileSync(
        path.resolve(import.meta.dirname, `../../../public/samples/${file}`),
        "utf8",
      );
      const points = parseGpx(xml);
      expect(points.length).toBeGreaterThan(100);
      const a = analyzeRoute({ points, profile });
      expect(a.status).toBe("ready");
      expect(a.route.distanceKm).toBeGreaterThan(5);
      expect(a.route.elevationGainM).toBeGreaterThan(200);
      expect(a.baseDifficulty.overall).toBeGreaterThan(0);
    });
  }
});
