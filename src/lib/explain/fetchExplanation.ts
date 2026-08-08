import type { HardestStretch } from "@/lib/engine/effort";
import type { RouteAnalysis } from "@/lib/engine";
import { buildOverviewExplainPayload } from "./buildExplainPayload";

export type ExplanationResult = {
  text: string;
  source: "template" | "llm";
  model?: string;
};

/** Call /api/explain; never throws — returns null on total failure. */
export async function fetchExplanation(
  analysis: RouteAnalysis,
): Promise<ExplanationResult | null> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "overview",
        analysis: buildOverviewExplainPayload(analysis),
      }),
    });
    const data = (await res.json()) as {
      text?: string;
      source?: "template" | "llm";
      model?: string;
    };
    if (!data.text) return null;
    const source = data.source === "llm" ? "llm" : "template";
    return {
      text: data.text,
      source,
      model: source === "llm" ? data.model : undefined,
    };
  } catch {
    return null;
  }
}

/** LLM may only explain the hardest stretch from structured numbers. */
export async function fetchHardestSegmentExplanation(
  stretch: HardestStretch,
): Promise<ExplanationResult | null> {
  try {
    const payload = {
      mode: "hardest_segment" as const,
      hardest: {
        startKm: stretch.startKm,
        endKm: stretch.endKm,
        estimatedEffort: stretch.estimatedEffort,
        peakEffort: stretch.peakEffort,
        avgGradePct: stretch.avgGradePct,
        gainM: stretch.gainM,
        label: stretch.label,
        peakSegment: {
          startKm: stretch.peakSegment.startKm,
          endKm: stretch.peakSegment.endKm,
          distanceM: stretch.peakSegment.distanceM,
          gainM: stretch.peakSegment.gainM,
          lossM: stretch.peakSegment.lossM,
          avgGradePct: stretch.peakSegment.avgGradePct,
          maxGradePct: stretch.peakSegment.maxGradePct,
          estimatedEffort: stretch.peakSegment.estimatedEffort,
          effortLabel: stretch.peakSegment.effortLabel,
        },
      },
    };
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      text?: string;
      source?: "template" | "llm";
      model?: string;
    };
    if (!data.text) return null;
    const source = data.source === "llm" ? "llm" : "template";
    return {
      text: data.text,
      source,
      model: source === "llm" ? data.model : undefined,
    };
  } catch {
    return null;
  }
}
