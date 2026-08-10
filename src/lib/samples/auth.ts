import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "oc_admin_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p ? p : null;
}

function adminSecret(): string {
  return (
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "outdoor-copilot-dev-admin"
  );
}

export function isAdminConfigured(): boolean {
  return Boolean(adminPassword());
}

export function verifyAdminPassword(password: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return createHmac("sha256", adminSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `v1.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [v, expStr, sig] = parts;
  if (v !== "v1") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const payload = `${v}.${expStr}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function requireAdminSession(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions(token: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  // Tencent mirror is often http://IP — Secure cookies would never stick there.
  const secure =
    process.env.ADMIN_COOKIE_SECURE === "1" ||
    (process.env.ADMIN_COOKIE_SECURE !== "0" && site.startsWith("https://"));
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}
