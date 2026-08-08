import type { UserProfile } from "@/lib/engine";

const KEY = "outdoor_copilot_profile_v1";

export function loadProfile(): Partial<UserProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<UserProfile>) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Partial<UserProfile>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}
