import type { RouteAnalysis } from "@/lib/engine";

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
      body: JSON.stringify({ analysis }),
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
