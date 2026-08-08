"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensureSegmentEffort,
  findHardestStretch,
  hardestStretchTemplate,
  type Segment,
} from "@/lib/engine";
import { fetchHardestSegmentExplanation } from "@/lib/explain/fetchExplanation";

type Props = {
  segments: Segment[];
  /** When true, optionally ask LLM to explain hardest segment only. */
  enableLlm?: boolean;
};

export function HardestSegmentNote({ segments, enableLlm = false }: Props) {
  const enriched = useMemo(() => ensureSegmentEffort(segments), [segments]);
  const stretch = useMemo(() => findHardestStretch(enriched), [enriched]);
  const template = stretch ? hardestStretchTemplate(stretch) : "";
  const [text, setText] = useState(template);
  const [source, setSource] = useState<"template" | "llm">("template");

  useEffect(() => {
    setText(template);
    setSource("template");
    if (!stretch || !enableLlm) return;

    let cancelled = false;
    void fetchHardestSegmentExplanation(stretch).then((result) => {
      if (cancelled || !result?.text) return;
      setText(result.text);
      setSource(result.source);
    });
    return () => {
      cancelled = true;
    };
  }, [template, enableLlm, stretch]);

  if (!stretch || !text) return null;

  return (
    <div>
      <p className="mb-2 font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
        最难一段
      </p>
      <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{text}</p>
      {enableLlm ? (
        <p className="mt-2 text-xs text-[var(--rock)]">
          {source === "llm" ? "LLM 解释（仅此段）" : "模板解释"}
        </p>
      ) : null}
    </div>
  );
}
