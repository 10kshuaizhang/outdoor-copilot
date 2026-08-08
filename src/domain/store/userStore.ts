import type { User } from "@/domain/types";
import { STORAGE_KEYS } from "./keys";
import { readJson, writeJson } from "./jsonStore";

export function getOrCreateUser(): User {
  const existing = readJson<User | null>(STORAGE_KEYS.user, null);
  if (existing?.id) return existing;
  const user: User = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.user, user);
  return user;
}
