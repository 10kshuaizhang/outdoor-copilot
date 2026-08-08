import type { ReactNode } from "react";

/** Light markdown → React for LLM explanations (bold, lists, paragraphs). */
export function ExplanationBody({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-[var(--ink-soft)]">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trimEnd());
        const listLines = lines.filter((l) => /^(?:[-*•]|\d+[.)])\s+/.test(l));
        if (listLines.length >= 2 && listLines.length === lines.length) {
          const ordered = /^\d+[.)]\s+/.test(lines[0]);
          const ListTag = ordered ? "ol" : "ul";
          return (
            <ListTag
              key={i}
              className={
                ordered
                  ? "list-decimal space-y-1.5 pl-5"
                  : "list-disc space-y-1.5 pl-5"
              }
            >
              {lines.map((line, j) => (
                <li key={j}>
                  {renderInline(
                    line.replace(/^(?:[-*•]|\d+[.)])\s+/, ""),
                  )}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  // **bold**, *italic*, `code`, strip leftover heading marks
  const cleaned = text.replace(/^#{1,6}\s+/, "");
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded bg-black/5 px-1 py-0.5 text-[0.9em] text-[var(--ink)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
