import type { User } from "@/domain/types";
import { createId } from "@/lib/id";
import { STORAGE_KEYS } from "./keys";
import { readJson, writeJson } from "./jsonStore";

export function getOrCreateUser(): User {
  const existing = readJson<User | null>(STORAGE_KEYS.user, null);
  if (existing?.id) return existing;
  const user: User = {
    id: createId(),
    createdAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.user, user);
  return user;
}
