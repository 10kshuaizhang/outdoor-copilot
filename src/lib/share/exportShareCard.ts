import type { RouteAnalysis } from "@/lib/engine";
import { buildShareCaption } from "./buildShareCaption";
import { renderShareCardPng } from "./renderShareCard";

export type ShareCardResult =
  | { ok: true; method: "share" | "download"; caption: string; blob: Blob }
  | { ok: false; message: string; caption?: string; blob?: Blob };

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function generateShareCard(input: {
  analysis: RouteAnalysis;
  title?: string;
}): Promise<{ blob: Blob; caption: string; file: File }> {
  const blob = await renderShareCardPng(input);
  const caption = buildShareCaption(input.analysis, input.title);
  const safe =
    (input.title ?? "route")
      .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "route";
  const file = new File([blob], `outdoor-copilot-${safe}.png`, {
    type: "image/png",
  });
  return { blob, caption, file };
}

/** Prefer native share with image file; otherwise download PNG. */
export async function shareOrDownloadCard(input: {
  analysis: RouteAnalysis;
  title?: string;
}): Promise<ShareCardResult> {
  try {
    const { blob, caption, file } = await generateShareCard(input);

    const canFiles =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] });

    if (canFiles && typeof navigator.share === "function") {
      try {
        await navigator.share({
          files: [file],
          title: "Outdoor Copilot",
          text: caption,
        });
        return { ok: true, method: "share", caption, blob };
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "AbortError") {
          return { ok: false, message: "已取消分享。", caption, blob };
        }
        // fall through to download
      }
    }

    downloadBlob(blob, file.name);
    return { ok: true, method: "download", caption, blob };
  } catch {
    return {
      ok: false,
      message: "生成分享图失败。请换一个较新的浏览器再试。",
    };
  }
}

export async function downloadShareCard(input: {
  analysis: RouteAnalysis;
  title?: string;
}): Promise<ShareCardResult> {
  try {
    const { blob, caption, file } = await generateShareCard(input);
    downloadBlob(blob, file.name);
    return { ok: true, method: "download", caption, blob };
  } catch {
    return { ok: false, message: "保存图片失败。" };
  }
}

export { buildShareCaption };
