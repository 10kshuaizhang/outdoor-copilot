"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type LabelWithTipProps = {
  children: ReactNode;
  tip: string;
  tipLabel?: string;
  className?: string;
};

/**
 * Low-chrome glossary: dashed underline on the words themselves.
 * Click opens a viewport-clamped portal panel (never clipped by overflow).
 */
export function LabelWithTip({
  children,
  tip,
  tipLabel,
  className = "",
}: LabelWithTipProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const a11y = tipLabel ?? "说明";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const gap = 8;
    const margin = 10;
    const tr = trigger.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - margin * 2);
    const height = panel.offsetHeight || 72;

    let left = tr.left + tr.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    const spaceBelow = window.innerHeight - tr.bottom - margin;
    const spaceAbove = tr.top - margin;
    const placeAbove = spaceBelow < height + gap && spaceAbove > spaceBelow;

    let top = placeAbove ? tr.top - height - gap : tr.bottom + gap;
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));

    setPos({
      position: "fixed",
      top,
      left,
      width,
      zIndex: 80,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onWin = () => place();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, tip, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      close();
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
    <span className={`inline max-w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="info-tip-trigger inline border-0 bg-transparent p-0 text-inherit cursor-help underline decoration-dashed decoration-current/40 underline-offset-[0.22em] transition hover:decoration-solid hover:decoration-current/70 focus-visible:rounded-sm"
        aria-label={a11y}
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {children}
      </button>
      {mounted && open
        ? createPortal(
            <span
              ref={panelRef}
              id={tipId}
              role="tooltip"
              style={pos}
              className="rounded-md border border-[var(--border-soft)] bg-[var(--surface-solid)] px-3 py-2.5 text-left text-xs leading-relaxed text-[var(--ink-soft)] shadow-[var(--shadow-lift)]"
            >
              {tip}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

/** @deprecated Use LabelWithTip — kept so older imports don't break. */
export function InfoTip({
  text,
  label,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  return (
    <LabelWithTip tip={text} tipLabel={label}>
      说明
    </LabelWithTip>
  );
}
