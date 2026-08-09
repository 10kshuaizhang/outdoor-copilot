import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard, exportSummaryText } from "./exportSummary";

describe("copyToClipboard", () => {
  it("uses execCommand when not a secure context (HTTP)", async () => {
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: false,
    });
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const textarea = {
      value: "",
      style: {} as Record<string, string>,
      setAttribute: vi.fn(),
      focus: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn(),
    };
    const doc = {
      createElement: vi.fn(() => textarea),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      getSelection: vi.fn(() => null),
      execCommand: vi.fn(() => true),
    };
    vi.stubGlobal("document", doc);

    const ok = await copyToClipboard("brief body");
    expect(ok).toBe(true);
    expect(doc.execCommand).toHaveBeenCalledWith("copy");
    expect(writeText).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

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
