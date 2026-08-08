import { describe, expect, it } from "vitest";
import { createId } from "./id";

describe("createId", () => {
  it("returns a uuid-like string", () => {
    const id = createId();
    expect(id.length).toBeGreaterThanOrEqual(16);
    expect(id).toMatch(/^[0-9a-f-]+$/i);
  });

  it("returns unique values", () => {
    const a = createId();
    const b = createId();
    expect(a).not.toBe(b);
  });
});
