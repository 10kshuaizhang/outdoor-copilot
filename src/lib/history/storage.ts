import type { RouteAnalysis } from "@/lib/engine";

export type SavedAnalysis = {
  id: string;
  title: string;
  createdAt: string;
  analysis: RouteAnalysis;
};

const KEY = "outdoor_copilot_history_v1";

export function listAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedAnalysis[]) : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(title: string, analysis: RouteAnalysis): void {
  if (typeof window === "undefined") return;
  try {
    const list = listAnalyses();
    list.unshift({
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
      analysis,
    });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)));
  } catch {
    // ignore
  }
}

export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem("outdoor_copilot_profile_v1");
  window.localStorage.removeItem("outdoor_copilot_events_v1");
}
