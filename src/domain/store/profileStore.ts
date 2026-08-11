import {
  engineProfileToOutdoor,
  type OutdoorProfile,
} from "@/domain/types";
import type { UserProfile } from "@/lib/engine";
import { STORAGE_KEYS } from "./keys";
import { readJson, writeJson } from "./jsonStore";
import { getOrCreateUser } from "./userStore";

/** Migrate v1 engine profile blob if present. */
function migrateV1IfNeeded(userId: string): OutdoorProfile | null {
  try {
    const raw = window.localStorage.getItem("outdoor_copilot_profile_v1");
    if (!raw) return null;
    const legacy = JSON.parse(raw) as Partial<UserProfile>;
    const next = engineProfileToOutdoor(userId, legacy);
    writeJson(STORAGE_KEYS.profile, next);
    return next;
  } catch {
    return null;
  }
}

export function loadOutdoorProfile(): OutdoorProfile | null {
  if (typeof window === "undefined") return null;
  const user = getOrCreateUser();
  const stored = readJson<OutdoorProfile | null>(STORAGE_KEYS.profile, null);
  if (stored) return stored;
  return migrateV1IfNeeded(user.id);
}

export function saveOutdoorProfile(
  partial: Partial<OutdoorProfile> &
    Partial<UserProfile> & { lastHikeAt?: string },
): OutdoorProfile {
  const user = getOrCreateUser();
  const prev = loadOutdoorProfile();
  const fromEngine = engineProfileToOutdoor(user.id, {
    experience: partial.experience ?? prev?.experience ?? "beginner",
    comfortableDistanceKm:
      partial.typicalDistanceKm ??
      partial.comfortableDistanceKm ??
      prev?.typicalDistanceKm,
    comfortableElevationM:
      partial.typicalElevationM ??
      partial.comfortableElevationM ??
      prev?.typicalElevationM,
    riskPreference: partial.riskPreference ?? prev?.riskPreference,
    age: partial.age ?? prev?.age,
    heightCm: partial.heightCm ?? prev?.heightCm,
    weightKg: partial.weightKg ?? prev?.weightKg,
    restingHr: partial.restingHr ?? prev?.restingHr,
    maxHr: partial.maxHr ?? prev?.maxHr,
    packWeightKg: partial.packWeightKg ?? prev?.packWeightKg,
  });
  const next: OutdoorProfile = {
    ...fromEngine,
    lastHikeAt: partial.lastHikeAt ?? prev?.lastHikeAt,
  };
  writeJson(STORAGE_KEYS.profile, next);
  return next;
}
