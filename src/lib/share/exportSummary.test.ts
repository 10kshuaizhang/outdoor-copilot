import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exportSummaryText } from "./exportSummary";

describe("exportSummaryText", () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: originalShare,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
  });

  it("uses navigator.share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });

    const result = await exportSummaryText("hello trail");
    expect(result).toEqual({ ok: true, method: "share" });
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ text: "hello trail" }),
    );
  });

  it("falls back to clipboard when share is unavailable", async () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: true,
    });

    const result = await exportSummaryText("hello trail");
    expect(result).toEqual({ ok: true, method: "clipboard" });
    expect(writeText).toHaveBeenCalledWith("hello trail");
  });
});
