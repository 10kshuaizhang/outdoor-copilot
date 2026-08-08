import type { RouteAnalysis, TrackPoint, UserProfile } from "@/lib/engine";

export type ActivityFeedback = {
  analysisId: string;
  actualTotalMin?: number;
  perceivedDifficulty?: number;
  createdAt: string;
};

export type SavedAnalysis = {
  id: string;
  title: string;
  createdAt: string;
  analysis: RouteAnalysis;
  points: TrackPoint[];
  profileSnapshot?: Partial<UserProfile>;
  feedback?: ActivityFeedback;
};

const KEY = "outdoor_copilot_history_v1";
const FEEDBACK_KEY = "outdoor_copilot_feedback_v1";

export type SaveResult = { ok: true; id: string } | { ok: false; message: string };

export function listAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedAnalysis[]) : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(input: {
  title: string;
  analysis: RouteAnalysis;
  points: TrackPoint[];
  profileSnapshot?: Partial<UserProfile>;
  replaceId?: string;
}): SaveResult {
  if (typeof window === "undefined") {
    return { ok: false, message: "当前环境无法写入本地存储。" };
  }
  try {
    const list = listAnalyses();
    const id = input.replaceId ?? crypto.randomUUID();
    const entry: SavedAnalysis = {
      id,
      title: input.title,
      createdAt: new Date().toISOString(),
      analysis: input.analysis,
      points: input.points,
      profileSnapshot: input.profileSnapshot,
    };
    const next = input.replaceId
      ? list.map((item) => (item.id === input.replaceId ? entry : item))
      : [entry, ...list];
    window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, 40)));
    return { ok: true, id };
  } catch {
    return {
      ok: false,
      message: "本地存储不可用或已满，本次分析未保存到历史（仍可查看当前结果）。",
    };
  }
}

/** Patch fields on an existing history entry (e.g. persist LLM explanation). */
export function patchSavedAnalysis(
  id: string,
  patch: {
    analysis?: RouteAnalysis;
    explanation?: RouteAnalysis["explanation"];
    profileSnapshot?: Partial<UserProfile>;
  },
): SaveResult {
  if (typeof window === "undefined") {
    return { ok: false, message: "当前环境无法写入本地存储。" };
  }
  try {
    const list = listAnalyses();
    const idx = list.findIndex((item) => item.id === id);
    if (idx < 0) {
      return { ok: false, message: "未找到该历史记录。" };
    }
    const prev = list[idx];
    const analysis = patch.analysis
      ? patch.analysis
      : patch.explanation
        ? { ...prev.analysis, explanation: patch.explanation }
        : prev.analysis;
    const nextEntry: SavedAnalysis = {
      ...prev,
      analysis,
      profileSnapshot: patch.profileSnapshot ?? prev.profileSnapshot,
    };
    const next = [...list];
    next[idx] = nextEntry;
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return { ok: true, id };
  } catch {
    return { ok: false, message: "更新历史记录失败。" };
  }
}

export function saveFeedback(feedback: ActivityFeedback): SaveResult {
  if (typeof window === "undefined") {
    return { ok: false, message: "无法保存回填。" };
  }
  try {
    const raw = window.localStorage.getItem(FEEDBACK_KEY);
    const list: ActivityFeedback[] = raw
      ? (JSON.parse(raw) as ActivityFeedback[])
      : [];
    list.unshift(feedback);
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list.slice(0, 200)));

    const analyses = listAnalyses().map((item) =>
      item.id === feedback.analysisId ? { ...item, feedback } : item,
    );
    window.localStorage.setItem(KEY, JSON.stringify(analyses));
    return { ok: true, id: feedback.analysisId };
  } catch {
    return { ok: false, message: "回填保存失败。" };
  }
}

export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(FEEDBACK_KEY);
  window.localStorage.removeItem("outdoor_copilot_profile_v1");
  window.localStorage.removeItem("outdoor_copilot_events_v1");
}
