/** Xiaohongshu note body limit (characters; each CJK / letter / newline counts as 1). */
export const XHS_CAPTION_MAX = 1000;

/** Default hashtag block appended when copying / sharing. */
export const XHS_HASHTAGS =
  "#户外徒步 #徒步天气预报 #徒步路线推荐 #OutdoorCopilot #个人难度";

/** Signature line used in share-card captions. */
export const XHS_SIGNATURE = "Outdoor Copilot · 先看清这条路对你有多难";

/**
 * Count characters the way XHS does for practical limits:
 * iterate Unicode code points (not UTF-16 code units).
 */
export function xhsCharCount(text: string): number {
  return Array.from(text).length;
}

/**
 * Hard-clamp to max code points. Prefer cutting at a newline / sentence
 * near the end so we don't mid-sentence chop when possible.
 */
export function clampXhsText(text: string, max = XHS_CAPTION_MAX): string {
  const chars = Array.from(text.trimEnd());
  if (chars.length <= max) return chars.join("");

  const budget = Math.max(1, max);
  const slice = chars.slice(0, budget).join("");

  const nl = slice.lastIndexOf("\n");
  if (nl >= Math.floor(budget * 0.65)) {
    return slice.slice(0, nl).trimEnd();
  }

  const punct = Math.max(
    slice.lastIndexOf("。"),
    slice.lastIndexOf("！"),
    slice.lastIndexOf("？"),
    slice.lastIndexOf("；"),
  );
  if (punct >= Math.floor(budget * 0.65)) {
    return slice.slice(0, punct + 1).trimEnd();
  }

  const trimmed = slice.trimEnd();
  const trimmedChars = Array.from(trimmed);
  if (trimmedChars.length >= budget) {
    return `${trimmedChars.slice(0, budget - 1).join("")}…`;
  }
  return `${trimmed}…`;
}

/**
 * Max body length so header + body + signature + hashtags ≤ XHS_CAPTION_MAX.
 * Matches assembleXhsCaption layout: [header, body, "", signature, hashtags].join("\n")
 */
export function xhsBodyBudget(opts?: {
  title?: string;
  verdictLabel?: string;
}): number {
  const title = opts?.title?.trim() || "路线分析";
  const verdict = opts?.verdictLabel?.trim() || "谨慎考虑";
  const header = `【${title}】${verdict}`;
  // Overhead with empty body (same newline structure as a real caption).
  const fixed = xhsCharCount(
    [header, "", "", XHS_SIGNATURE, XHS_HASHTAGS].join("\n"),
  );
  return Math.max(200, XHS_CAPTION_MAX - fixed);
}

/** LLM polish target: leave a small safety margin under body budget. */
export function xhsPolishTargetChars(opts?: {
  title?: string;
  verdictLabel?: string;
}): number {
  return Math.max(180, xhsBodyBudget(opts) - 40);
}

/** Assemble a full XHS caption and hard-clamp to 1000. */
export function assembleXhsCaption(input: {
  title?: string;
  verdictLabel?: string;
  body: string;
}): string {
  const title = input.title?.trim() || "路线分析";
  const verdict = input.verdictLabel?.trim() || "";
  const header = verdict ? `【${title}】${verdict}` : `【${title}】`;
  const budget = xhsBodyBudget({
    title,
    verdictLabel: verdict || "谨慎考虑",
  });
  const body = clampXhsText(input.body.trim(), budget);
  const full = [header, body, "", XHS_SIGNATURE, XHS_HASHTAGS].join("\n");
  return clampXhsText(full, XHS_CAPTION_MAX);
}

/** Brief-card copy: body + hashtags only, still ≤ 1000. */
export function assembleXhsBriefCopy(body: string): string {
  const footer = `\n\n${XHS_HASHTAGS}`;
  const budget = Math.max(200, XHS_CAPTION_MAX - xhsCharCount(footer));
  const clampedBody = clampXhsText(body.trim(), budget);
  return clampXhsText(`${clampedBody}${footer}`, XHS_CAPTION_MAX);
}
