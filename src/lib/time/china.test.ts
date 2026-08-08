import { describe, expect, it } from "vitest";
import { formatShanghaiClock, shanghaiWallIso } from "./china";

describe("shanghai wall clock", () => {
  it("07:30 Shanghai is not 23:30 when formatted back", () => {
    const iso = shanghaiWallIso("2026-08-08", 7, 30);
    expect(iso).toBe("2026-08-07T23:30:00.000Z");
    expect(formatShanghaiClock(iso)).toBe("07:30");
  });

  it("formats finish windows in Shanghai", () => {
    const start = shanghaiWallIso("2026-08-08", 7, 30);
    const finish = new Date(
      new Date(start).getTime() + 211 * 60000,
    ).toISOString();
    expect(formatShanghaiClock(finish)).toBe("11:01");
  });
});
