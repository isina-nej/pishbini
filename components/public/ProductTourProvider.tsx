"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PageId } from "@/lib/page-access.shared";
import { NAV_TAB_ORDER } from "@/lib/page-access.shared";
import {
  buildTourSteps,
  isTourDone,
  markTourDone,
  tourKeyForRoute,
  type TourKey,
} from "@/lib/product-tour";
import { ProductTour } from "./ProductTour";
import { usePageAccess } from "./PageAccessProvider";

type TourContextValue = {
  active: boolean;
  stepId: string | null;
};

const TourContext = createContext<TourContextValue>({ active: false, stepId: null });

const TourPageReadySetterContext = createContext<(ready: boolean) => void>(() => {});

export function useProductTour() {
  return useContext(TourContext);
}

export function useTourPageReadySetter() {
  return useContext(TourPageReadySetterContext);
}

function waitForSplashDone(): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + 30_000;

    const check = () => {
      const overlay = document.querySelector('[data-splash-overlay="1"]');
      if (overlay) {
        window.addEventListener("wc:splash-dismissed", () => resolve(), { once: true });
        return;
      }
      if (Date.now() >= deadline) {
        resolve();
        return;
      }
      window.setTimeout(check, 120);
    };

    check();
  });
}

async function waitForTarget(target: string, maxMs = 15_000, cancelled?: () => boolean) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (cancelled?.()) return false;
    if (document.querySelector(`[data-tour="${target}"]`)) return true;
    await new Promise((r) => window.setTimeout(r, 200));
  }
  return false;
}

export function ProductTourProvider({
  pageId,
  hasMatches = true,
  tourReady = true,
  children,
}: {
  pageId: PageId;
  hasMatches?: boolean;
  tourReady?: boolean;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ProductTourProviderFallback>{children}</ProductTourProviderFallback>}>
      <ProductTourProviderInner
        pageId={pageId}
        hasMatches={hasMatches}
        tourReady={tourReady}
      >
        {children}
      </ProductTourProviderInner>
    </Suspense>
  );
}

function ProductTourProviderFallback({ children }: { children: ReactNode }) {
  const ctx = useMemo<TourContextValue>(() => ({ active: false, stepId: null }), []);
  const setPageReady = useCallback(() => {}, []);

  return (
    <TourPageReadySetterContext.Provider value={setPageReady}>
      <TourContext.Provider value={ctx}>{children}</TourContext.Provider>
    </TourPageReadySetterContext.Provider>
  );
}

function ProductTourProviderInner({
  pageId,
  hasMatches = true,
  tourReady = true,
  children,
}: {
  pageId: PageId;
  hasMatches?: boolean;
  tourReady?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const embed = useSearchParams().get("embed") === "1";
  const { loaded, isPageVisible } = usePageAccess();
  const tourKey = tourKeyForRoute(pageId, pathname);

  const [contentReady, setContentReady] = useState(true);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [runId, setRunId] = useState(0);

  const visiblePages = useMemo(
    () => NAV_TAB_ORDER.filter((id) => isPageVisible(id)),
    [isPageVisible]
  );

  const steps = useMemo(
    () => buildTourSteps(tourKey, visiblePages, { hasMatches }),
    [tourKey, visiblePages, hasMatches]
  );

  const currentStep = active ? (steps[stepIndex] ?? null) : null;
  const ready = tourReady && contentReady && loaded;

  const finish = useCallback(() => {
    setActive(false);
    markTourDone(tourKey);
    document.documentElement.removeAttribute("data-tour-active");
  }, [tourKey]);

  const advance = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [finish, steps.length]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setActive(true);
    document.documentElement.setAttribute("data-tour-active", "1");
  }, []);

  const skipMissingOptional = useCallback(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el && step.optional) advance();
  }, [active, advance, stepIndex, steps]);

  useEffect(() => {
    skipMissingOptional();
  }, [skipMissingOptional, stepIndex]);

  useEffect(() => {
    if (!currentStep?.waitForTarget) return;
    if (document.querySelector(`[data-tour="${currentStep.target}"]`)) return;
    const timer = window.setInterval(() => {
      if (document.querySelector(`[data-tour="${currentStep.target}"]`)) {
        skipMissingOptional();
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [currentStep, skipMissingOptional]);

  useEffect(() => {
    if (embed || !ready) return;
    if (isTourDone(tourKey)) return;
    if (steps.length === 0) return;

    let cancelled = false;

    (async () => {
      await waitForSplashDone();
      if (cancelled || isTourDone(tourKey)) return;

      const first = steps[0];
      if (first) {
        const found = await waitForTarget(first.target, 15_000, () => cancelled);
        if (!found && !first.optional) return;
      }

      await new Promise((r) => window.setTimeout(r, 350));
      if (cancelled || isTourDone(tourKey)) return;

      startTour();
    })();

    return () => {
      cancelled = true;
    };
  }, [embed, ready, tourKey, steps, runId, startTour]);

  useEffect(() => {
    const onRestart = (e: Event) => {
      const key = (e as CustomEvent<{ key: TourKey }>).detail?.key;
      if (key !== tourKey) return;
      setRunId((n) => n + 1);
      startTour();
    };
    window.addEventListener("wc:tour-restart", onRestart);
    return () => window.removeEventListener("wc:tour-restart", onRestart);
  }, [tourKey, startTour]);

  useEffect(() => {
    if (!active || !currentStep) return;
    document.documentElement.dataset.tourStep = currentStep.id;
    return () => {
      delete document.documentElement.dataset.tourStep;
    };
  }, [active, currentStep]);

  useEffect(() => {
    if (active) return;
    document.documentElement.removeAttribute("data-tour-active");
    delete document.documentElement.dataset.tourStep;
  }, [active]);

  const ctx = useMemo<TourContextValue>(
    () => ({ active, stepId: currentStep?.id ?? null }),
    [active, currentStep?.id]
  );

  const setPageReady = useCallback((value: boolean) => {
    setContentReady(value);
  }, []);

  return (
    <TourPageReadySetterContext.Provider value={setPageReady}>
      <TourContext.Provider value={ctx}>
        {children}
        {active && steps.length > 0 && (
          <ProductTour
            step={currentStep}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            onAdvance={advance}
          />
        )}
      </TourContext.Provider>
    </TourPageReadySetterContext.Provider>
  );
}
