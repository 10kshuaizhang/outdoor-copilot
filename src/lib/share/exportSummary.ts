export type ShareResult =
  | { ok: true; method: "share" | "clipboard" }
  | { ok: false; message: string };

function copyWithExecCommand(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.padding = "0";
  textarea.style.border = "none";
  textarea.style.outline = "none";
  textarea.style.boxShadow = "none";
  textarea.style.background = "transparent";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  document.body.removeChild(textarea);
  if (previousRange && selection) {
    selection.removeAllRanges();
    selection.addRange(previousRange);
  }
  return ok;
}

/**
 * Copy plain text. Uses Clipboard API only in secure contexts (HTTPS/localhost);
 * falls back to execCommand so HTTP mirrors (e.g. Tencent Cloud IP) still work.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const secure =
    typeof globalThis !== "undefined" &&
    "isSecureContext" in globalThis &&
    Boolean((globalThis as { isSecureContext?: boolean }).isSecureContext);

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    secure
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand — common on iOS Safari / denied permission
    }
  }
  return copyWithExecCommand(text);
}

/**
 * Prefer the native share sheet on mobile (works well on iOS),
 * then fall back to clipboard copy with an execCommand path.
 */
export async function exportSummaryText(text: string): Promise<ShareResult> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({
        title: "Outdoor Copilot 路线摘要",
        text,
      });
      return { ok: true, method: "share" };
    } catch (err) {
      // User cancelled share sheet — not a hard failure if we can still copy.
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") {
        return { ok: false, message: "已取消分享。" };
      }
      // continue to clipboard
    }
  }

  const copied = await copyToClipboard(text);
  if (copied) {
    return { ok: true, method: "clipboard" };
  }

  return {
    ok: false,
    message: "无法自动复制。请长按下方摘要手动复制。",
  };
}
