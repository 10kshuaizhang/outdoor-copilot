import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeRoute } from "@/lib/engine";
import { SHORT_CLIMB_POINTS } from "@/lib/engine/fixtures/shortClimb.points";
import { MODEL_VERSION } from "./types";

describe("prediction store immutability", () => {
  beforeEach(() => {
    const map = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => {
          map.set(k, v);
        },
        removeItem: (k: string) => {
          map.delete(k);
        },
      },
    });
    vi.stubGlobal("crypto", {
      randomUUID: () => `id-${map.size}-${Math.random().toString(16).slice(2)}`,
    });
  });

  it("appends predictions and never overwrites prior numeric snapshot", async () => {
    const { savePrediction, listPredictions, markPredictionHiking } =
      await import("./store/predictionStore");

    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "intermediate" },
      weather: { source: "fallback" },
    });

    const first = savePrediction({
      title: "线 A",
      points: SHORT_CLIMB_POINTS,
      analysis,
      profileSnapshot: { experience: "intermediate" },
      source: "sample",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const score = first.prediction.personalDifficulty.overall;
    const second = savePrediction({
      title: "线 B",
      points: SHORT_CLIMB_POINTS,
      analysis,
      profileSnapshot: { experience: "advanced" },
      source: "upload",
    });
    expect(second.ok).toBe(true);

    const all = listPredictions();
    expect(all.length).toBe(2);
    expect(all.every((p) => p.modelVersion === MODEL_VERSION)).toBe(true);

    markPredictionHiking(first.prediction.id);
    const again = listPredictions().find((p) => p.id === first.prediction.id);
    expect(again?.personalDifficulty.overall).toBe(score);
    expect(again?.status).toBe("hiking");
  });
});
