"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TourStep } from "@/lib/product-tour";

const PAD = 8;
const MARGIN = 12;
const GAP = 10;
const NAV_CLEARANCE = 88;

type Props = {
  step: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  onAdvance: () => void;
};

function clampHighlightRect(rect: DOMRect): DOMRect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.max(0, rect.left - PAD);
  const top = Math.max(0, rect.top - PAD);
  const right = Math.min(vw, rect.right + PAD);
  const bottom = Math.min(vh, rect.bottom + PAD);
  return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

function shouldUseSheetPlacement(step: TourStep, rect: DOMRect): boolean {
  if (step.placement === "sheet") return true;
  if (step.target.startsWith("nav-")) return true;
  if (step.target === "submit-predictions" || step.target === "bracket-submit") return true;
  return rect.bottom > window.innerHeight - 150;
}

function useTargetRect(target: string | undefined) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const update = useCallback(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${target}"]`);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [target]);

  useEffect(() => {
    update();
    const el = document.querySelector(`[data-tour="${target}"]`);
    const ro = el ? new ResizeObserver(update) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [target, update]);

  return { rect, update };
}

function OverlayPanels({ rect }: { rect: DOMRect }) {
  const x = rect.left;
  const y = rect.top;
  const w = rect.width;
  const h = rect.height;
  const bottom = y + h;

  const panel = "fixed bg-black/78 pointer-events-auto";

  return (
    <>
      <div className={panel} style={{ top: 0, left: 0, right: 0, height: y }} />
      <div className={panel} style={{ top: y, left: 0, width: x, height: h }} />
      <div className={panel} style={{ top: y, left: x + w, right: 0, height: h }} />
      <div className={panel} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
    </>
  );
}

function Tooltip({
  step,
  rect,
  stepIndex,
  totalSteps,
  onAdvance,
}: {
  step: TourStep;
  rect: DOMRect;
  stepIndex: number;
  totalSteps: number;
  onAdvance: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sheet = shouldUseSheetPlacement(step, rect);
  const isLast = stepIndex >= totalSteps - 1;
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  const updatePosition = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipH = el.offsetHeight;
    const tooltipW = Math.min(352, vw - MARGIN * 2);
    const targetTop = Math.max(0, rect.top - PAD);
    const targetBottom = rect.bottom + PAD;
    const bottomInset = NAV_CLEARANCE + MARGIN;

    if (sheet) {
      setStyle({
        left: MARGIN,
        right: MARGIN,
        width: "auto",
        maxWidth: vw - MARGIN * 2,
        bottom: `calc(${NAV_CLEARANCE}px + env(safe-area-inset-bottom, 0px) + ${MARGIN}px)`,
        top: "auto",
        maxHeight: `min(42dvh, ${vh - bottomInset - MARGIN}px)`,
        visibility: "visible",
      });
      return;
    }

    const spaceBelow = vh - targetBottom - bottomInset - MARGIN;
    const spaceAbove = targetTop - MARGIN;
    let top: number;

    if (spaceBelow >= tooltipH + GAP) {
      top = targetBottom + GAP;
    } else if (spaceAbove >= tooltipH + GAP) {
      top = targetTop - tooltipH - GAP;
    } else {
      top = Math.max(MARGIN, Math.min(targetBottom + GAP, vh - tooltipH - bottomInset));
    }

    top = Math.max(MARGIN, Math.min(top, vh - tooltipH - bottomInset - MARGIN));

    const centerX = rect.left + rect.width / 2;
    const left = Math.max(MARGIN, Math.min(centerX - tooltipW / 2, vw - tooltipW - MARGIN));

    setStyle({
      left,
      top,
      width: tooltipW,
      maxHeight: vh - top - bottomInset - MARGIN,
      bottom: "auto",
      right: "auto",
      visibility: "visible",
    });
  }, [rect, sheet]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition, step.title, step.description, stepIndex]);

  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: sheet ? 12 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-auto fixed z-[152] overflow-y-auto overscroll-contain rounded-2xl border border-white/12 bg-[#16172a] p-3.5 shadow-2xl sm:p-4"
      style={style}
    >
      <p className="text-[10px] font-medium text-primary/90">
        آموزش {(stepIndex + 1).toLocaleString("fa-IR")} از{" "}
        {totalSteps.toLocaleString("fa-IR")}
      </p>
      <h3 className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">{step.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-white/70 sm:mt-2 sm:text-sm">
        {step.description}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4">
        {step.advance === "click-target" ? (
          <p className="min-w-0 text-[11px] text-white/45 sm:text-xs">روی بخش مشخص‌شده بزنید</p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onAdvance}
          className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-[#10111f] sm:px-4"
        >
          {isLast ? "پایان" : "بعدی"}
        </button>
      </div>
    </motion.div>
  );
}

function scrollStepTarget(step: TourStep, reduceMotion: boolean | null) {
  const behavior = reduceMotion ? "auto" : ("smooth" as ScrollBehavior);
  const el = document.querySelector(`[data-tour="${step.target}"]`);

  if (step.scrollTo === "bottom") {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
    return;
  }

  if (!(el instanceof HTMLElement)) return;

  const sheet =
    step.placement === "sheet" ||
    step.target.startsWith("nav-") ||
    step.target === "submit-predictions" ||
    step.target === "bracket-submit";

  el.scrollIntoView({
    behavior,
    block: sheet ? "end" : "center",
    inline: "nearest",
  });

  if (!sheet && !reduceMotion) {
    window.setTimeout(() => {
      window.scrollBy({ top: -72, behavior: "smooth" });
    }, 280);
  }
}

export function ProductTour({ step, stepIndex, totalSteps, onAdvance }: Props) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { rect, update } = useTargetRect(step?.target);
  const highlightRect = rect ? clampHighlightRect(rect) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!step?.target) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!(el instanceof HTMLElement)) return;

    const prev = { position: el.style.position, zIndex: el.style.zIndex };
    const computed = getComputedStyle(el);
    if (computed.position === "static") el.style.position = "relative";
    el.style.zIndex = "151";

    return () => {
      el.style.position = prev.position;
      el.style.zIndex = prev.zIndex;
    };
  }, [step?.target]);

  useEffect(() => {
    if (!step) return;

    const t1 = window.setTimeout(() => scrollStepTarget(step, reduceMotion), 80);
    const t2 = window.setTimeout(update, reduceMotion ? 120 : 450);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [step, update, reduceMotion]);

  useEffect(() => {
    if (!step || step.advance !== "click-target") return;

    const handler = (e: MouseEvent) => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el || !(e.target instanceof Node) || !el.contains(e.target)) return;

      if (step.blockNavigation) {
        e.preventDefault();
        e.stopPropagation();
      }

      window.setTimeout(onAdvance, step.blockNavigation ? 120 : 280);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [step, onAdvance]);

  useEffect(() => {
    if (!step?.waitForTarget) return;
    const behavior = reduceMotion ? "auto" : ("smooth" as ScrollBehavior);
    const scrollIfNeeded = () => {
      if (!document.querySelector(`[data-tour="${step.target}"]`)) return;
      if (step.scrollTo === "bottom") {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
      }
      update();
    };
    const timer = window.setInterval(scrollIfNeeded, 300);
    return () => window.clearInterval(timer);
  }, [step, update, reduceMotion]);

  if (!mounted || !step || !rect || !highlightRect) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-[150]"
        aria-live="polite"
      >
        <OverlayPanels rect={highlightRect} />

        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-primary sm:rounded-2xl"
          style={{
            left: highlightRect.left,
            top: highlightRect.top,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        >
          {!reduceMotion && (
            <div className="absolute inset-0 animate-pulse rounded-xl border border-primary/60 sm:rounded-2xl" />
          )}
        </div>

        <Tooltip
          step={step}
          rect={rect}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          onAdvance={onAdvance}
        />
      </motion.div>
    </AnimatePresence>
  );
}
