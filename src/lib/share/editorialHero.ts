import type { EditorialCardInput } from "./renderEditorialCard";

/** Split "4句" / "4 / 样" into digits + optional unit hint. */
export function parseHeroNumberField(raw: string): {
  number: string;
  unitHint: string;
} {
  const t = raw.trim();
  if (!t) return { number: "", unitHint: "" };
  const paired = t.match(/^(\d{1,3})\s*([/／].+|[一-龥]{1,4})$/);
  if (paired) {
    return { number: paired[1]!, unitHint: paired[2]!.trim() };
  }
  return { number: t.replace(/[^\d]/g, "").slice(0, 3), unitHint: "" };
}

/** Ensure units store as "/ 句", never "4句" or a floating bare「句」。 */
export function normalizeHeroUnit(raw: string): string {
  let t = raw.trim();
  if (!t) return "";
  // LLM / manual override sometimes puts the digit into the unit field.
  t = t.replace(/^\d+\s*/, "").trim();
  if (!t) return "";
  if (/^[/／]\s*\S+$/.test(t)) return t.replace(/^[/／]\s*/, "/ ").slice(0, 8);
  if (/^[\u4e00-\u9fff]{1,3}$/.test(t)) return `/ ${t}`;
  if (/^[a-zA-Z]{1,6}$/.test(t)) return `/ ${t}`;
  return t.slice(0, 8);
}

/** Measure word shown under the digit (no slash). */
export function heroMeasureLabel(unit: string): string {
  return unit.replace(/^[/／]\s*/, "").trim();
}

const HEADING_LIKE =
  /铁律|清单|提醒|法则|守则|步骤|指南|注意|要点$|概览|总结/;

/** Resolve overlapping hero chrome before paint or after LLM extract. */
export function settleHeroChrome(input: {
  heroNumber?: string;
  heroUnit?: string;
  heroLabel?: string;
  sectionTitle?: string;
}): {
  heroNumber: string;
  heroUnit: string;
  heroLabel: string;
  sectionTitle: string;
} {
  const parsed = parseHeroNumberField(input.heroNumber ?? "");
  let heroUnit = normalizeHeroUnit(input.heroUnit ?? "");
  if (!heroUnit && parsed.unitHint) {
    heroUnit = normalizeHeroUnit(parsed.unitHint);
  }
  let heroLabel = (input.heroLabel ?? "").trim().slice(0, 12);
  let sectionTitle = (input.sectionTitle ?? "").trim().slice(0, 24);

  const measure = heroMeasureLabel(heroUnit);
  // Drop labels that duplicate the measure ("句") or the whole unit.
  if (
    heroLabel &&
    (heroLabel === measure ||
      heroLabel === heroUnit ||
      heroLabel === `${parsed.number}${measure}` ||
      heroLabel === `${parsed.number}${heroUnit}`)
  ) {
    heroLabel = "";
  }

  const headingLike = HEADING_LIKE.test(heroLabel);
  if ((heroLabel.length > 5 || headingLike) && !sectionTitle) {
    sectionTitle = heroLabel.slice(0, 24);
    heroLabel = "";
  } else if (heroLabel.length > 5) {
    heroLabel = heroLabel.slice(0, 5);
  }
  if (heroLabel && sectionTitle && heroLabel === sectionTitle) {
    heroLabel = "";
  }

  return {
    heroNumber: parsed.number,
    heroUnit,
    heroLabel,
    sectionTitle,
  };
}

/** Defense-in-depth: clean manual overrides right before canvas paint. */
export function sanitizeEditorialForRender(
  input: EditorialCardInput,
): EditorialCardInput {
  const settled = settleHeroChrome(input);
  let heroUnit = settled.heroUnit;
  if (!heroUnit && settled.heroNumber) heroUnit = "/ 项";
  return {
    ...input,
    heroNumber: settled.heroNumber,
    heroUnit,
    heroLabel: settled.heroLabel,
    sectionTitle: settled.sectionTitle || undefined,
  };
}
