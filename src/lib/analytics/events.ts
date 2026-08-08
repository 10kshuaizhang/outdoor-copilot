export type AnalyticsEventName =
  | "landing_view"
  | "upload_gpx"
  | "upload"
  | "analysis_started"
  | "analysis_completed"
  | "analyze_base"
  | "analyze_personal"
  | "prediction_created"
  | "prediction_saved"
  | "copy_share"
  | "share_image"
  | "feedback";

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  at: string;
  props?: Record<string, string | number | boolean>;
};

const KEY = "outdoor_copilot_events_v1";

export function trackEvent(
  name: AnalyticsEventName,
  props?: AnalyticsEvent["props"],
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: AnalyticsEvent[] = raw
      ? (JSON.parse(raw) as AnalyticsEvent[])
      : [];
    list.push({ name, at: new Date().toISOString(), props });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-500)));
  } catch {
    // ignore quota / private mode
  }
}

export function exportEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}
