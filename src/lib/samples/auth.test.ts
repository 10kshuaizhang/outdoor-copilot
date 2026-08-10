import { describe, expect, it } from "vitest";
import {
  createAdminSessionToken,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from "./auth";

describe("admin auth", () => {
  it("rejects password when ADMIN_PASSWORD unset", () => {
    const prev = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    expect(verifyAdminPassword("x")).toBe(false);
    if (prev !== undefined) process.env.ADMIN_PASSWORD = prev;
  });

  it("round-trips session token", () => {
    const prev = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "test-admin-pass";
    const token = createAdminSessionToken();
    expect(verifyAdminSessionToken(token)).toBe(true);
    expect(verifyAdminSessionToken("bad")).toBe(false);
    expect(verifyAdminPassword("test-admin-pass")).toBe(true);
    expect(verifyAdminPassword("nope")).toBe(false);
    if (prev !== undefined) process.env.ADMIN_PASSWORD = prev;
    else delete process.env.ADMIN_PASSWORD;
  });
});
