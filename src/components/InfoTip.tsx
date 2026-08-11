"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  /** Plain-language explanation for ordinary hikers. */
  text: string;
  /** Accessible name; defaults to “说明”. */
  label?: string;
  className?: string;
};

/**
 * Mobile-first tip: tap to toggle. Desktop also supports hover via CSS,
 * but click remains the reliable path on touch devices.
 */
export function InfoTip({ text, label = "说明", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <span
      ref={rootRef}
      className={`info-tip relative inline-flex align-middle ${className}`}
    >
      <button
        type="button"
        className="info-tip-btn ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/70 text-[10px] font-semibold leading-none text-[var(--rock)] transition hover:border-[var(--pine)] hover:text-[var(--pine-deep)]"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="info-tip-panel absolute left-1/2 top-[calc(100%+6px)] z-40 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-[var(--border-soft)] bg-[var(--surface-solid)] px-3 py-2 text-left text-xs leading-relaxed text-[var(--ink-soft)] shadow-[var(--shadow-soft)]"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

/** Label row with an optional tip — keeps dt/p layouts tidy. */
export function LabelWithTip({
  children,
  tip,
  tipLabel,
  className = "",
}: {
  children: ReactNode;
  tip: string;
  tipLabel?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex max-w-full items-center ${className}`}>
      <span>{children}</span>
      <InfoTip text={tip} label={tipLabel ?? `${String(children)}说明`} />
    </span>
  );
}
