"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TourStep } from "@/lib/product-tour";

const PAD = 10;

type Props = {
  step: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  onAdvance: () => void;
  onSkip: () => void;
};

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
  const x = Math.max(0, rect.left - PAD);
  const y = Math.max(0, rect.top - PAD);
  const w = rect.width + PAD * 2;
  const h = rect.height + PAD * 2;
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
  onSkip,
}: {
  step: TourStep;
  rect: DOMRect;
  stepIndex: number;
  totalSteps: number;
  onAdvance: () => void;
  onSkip: () => void;
}) {
  const x = Math.max(0, rect.left - PAD);
  const y = Math.max(0, rect.top - PAD);
  const w = rect.width + PAD * 2;
  const bottom = y + rect.height + PAD * 2;
  const showBelow = bottom + 160 < window.innerHeight;
  const tooltipTop = showBelow ? bottom + 12 : Math.max(16, y - 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: showBelow ? 8 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed z-[152] mx-auto w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-[#16172a] p-4 shadow-2xl"
      style={{
        left: Math.min(Math.max(16, x + w / 2), window.innerWidth - 16),
        top: showBelow ? tooltipTop : undefined,
        bottom: showBelow ? undefined : window.innerHeight - tooltipTop,
        transform: "translateX(-50%)",
      }}
    >
      <p className="text-[10px] font-medium text-primary/90">
        آموزش {stepIndex + 1} از {totalSteps}
      </p>
      <h3 className="mt-1 text-base font-bold text-white">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{step.description}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        {step.advance === "click-target" ? (
          <p className="text-xs text-white/45">روی بخش مشخص‌شده بزنید</p>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl px-3 py-2 text-xs text-white/45 hover:text-white/65"
          >
            رد کردن
          </button>
          {step.advance === "next-button" && (
            <button
              type="button"
              onClick={onAdvance}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-[#10111f]"
            >
              بعدی
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ProductTour({ step, stepIndex, totalSteps, onAdvance, onSkip }: Props) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { rect, update } = useTargetRect(step?.target);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [step?.waitForTarget, update]);

  if (!mounted || !step) return null;

  return (
    <AnimatePresence>
      {rect ? (
        <motion.div
          key={step.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150]"
          aria-live="polite"
        >
          <OverlayPanels rect={rect} />

          <div
            className="pointer-events-none fixed rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-transparent"
            style={{
              left: rect.left - PAD,
              top: rect.top - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              boxShadow: "0 0 0 9999px transparent",
            }}
          >
            {!reduceMotion && (
              <div className="absolute inset-0 animate-pulse rounded-2xl border-2 border-primary/60" />
            )}
          </div>

          <Tooltip
            step={step}
            rect={rect}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            onAdvance={onAdvance}
            onSkip={onSkip}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
