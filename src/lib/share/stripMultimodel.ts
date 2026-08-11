/**
 * Remove multi-model forecast chatter from share/copy bodies.
 * Report UI keeps modelAgreement; pasted XHS captions do not need it.
 */
const MODEL_LEAD_PREFIX =
  /^(仅单一预报源，无法做多模型对照。|多模型较一致（[^）]*）。|多模型分歧偏大（[^）]*）；[^。]*。|多模型略有差别（[^）]*）。)+/;

export function stripMultimodelFromShareText(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let raw = lines[i] ?? "";
    const trimmed = raw.trim();

    // Template weather block: label "多模型" + following detail until blank.
    if (trimmed === "多模型") {
      i += 1;
      while (i < lines.length && (lines[i] ?? "").trim() !== "") i += 1;
      continue;
    }

    // Lead often concatenates model summary + weather sentence on one line.
    raw = raw.replace(MODEL_LEAD_PREFIX, "");
    if (!raw.trim()) continue;

    // Drop leftover pure model lines (LLM rephrases).
    if (
      /^多模型/.test(raw.trim()) ||
      /^仅单一预报源/.test(raw.trim())
    ) {
      continue;
    }

    out.push(raw);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
