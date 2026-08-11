import { describe, expect, it } from "vitest";
import {
  shanghaiNextDay,
  weatherEndDateForStart,
} from "./fetchWeather";

describe("weather date window for start time", () => {
  it("keeps same-day fetch for morning starts", () => {
    expect(
      weatherEndDateForStart("2026-08-08", "2026-08-07T23:30:00.000Z"), // 07:30 SH
    ).toBe("2026-08-08");
  });

  it("extends to next day for late-evening starts", () => {
    expect(
      weatherEndDateForStart("2026-08-08", "2026-08-08T15:30:00.000Z"), // 23:30 SH
    ).toBe("2026-08-09");
    expect(shanghaiNextDay("2026-08-08")).toBe("2026-08-09");
  });
});
