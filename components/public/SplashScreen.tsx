"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const FIRST_VISIT_KEY = "wc_splash_first_visit_done";
const PLAY_RETRY_DELAYS_MS = [100, 300, 600] as const;
const CELEBRATION_MS = 1450;

function readIsFirstVisit(): boolean {
  if (typeof window === "undefined") return true;
  return !localStorage.getItem(FIRST_VISIT_KEY);
}

async function attemptPlay(video: HTMLVideoElement): Promise<boolean> {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  try {
    await video.play();
    return !video.paused;
  } catch {
    return false;
  }
}

const FIREWORKS = [
  { x: "18%", y: "22%", delay: 0.05, hue: "#f7d774" },
  { x: "52%", y: "14%", delay: 0.18, hue: "#c8102e" },
  { x: "78%", y: "26%", delay: 0.1, hue: "#fff7d6" },
  { x: "34%", y: "42%", delay: 0.28, hue: "#f3b73f" },
  { x: "66%", y: "45%", delay: 0.22, hue: "#f8f8f8" },
] as const;

function SpainFlagBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute inset-x-[-18%] top-[14%] h-[24%] rounded-full bg-[#c8102e]/25 blur-3xl"
        animate={reduceMotion ? { opacity: 0.25 } : { opacity: [0.15, 0.32, 0.16], x: [0, 12, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-[-18%] top-[36%] h-[24%] rounded-full bg-[#f7d774]/28 blur-3xl"
        animate={reduceMotion ? { opacity: 0.28 } : { opacity: [0.18, 0.42, 0.2], x: [0, -10, 0] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-[-18%] top-[58%] h-[24%] rounded-full bg-[#c8102e]/22 blur-3xl"
        animate={reduceMotion ? { opacity: 0.22 } : { opacity: [0.14, 0.28, 0.16], x: [0, 8, 0] }}
        transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_46%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.42),rgba(0,0,0,0.28)_45%,rgba(0,0,0,0.55))]" />
    </div>
  );
}

function Fireworks({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {FIREWORKS.map((burst, i) => (
        <div key={`${burst.x}-${i}`} className="absolute" style={{ left: burst.x, top: burst.y }}>
          <motion.span
            className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[1px]"
            style={{ backgroundColor: burst.hue }}
            initial={{ opacity: 0, scale: 0.35 }}
            animate={{ opacity: [0, 1, 0], scale: [0.35, 1.8, 2.4] }}
            transition={{ duration: 1.05, delay: burst.delay, repeat: Infinity, repeatDelay: 0.65, ease: "easeOut" }}
          />
          {Array.from({ length: 8 }).map((_, j) => (
            <motion.span
              key={j}
              className="absolute left-1/2 top-1/2 block h-1.5 w-0.5 origin-bottom rounded-full"
              style={{ backgroundColor: burst.hue, transform: `translate(-50%, -50%) rotate(${j * 45}deg)` }}
              initial={{ opacity: 0, scaleY: 0.3, y: 0 }}
              animate={{ opacity: [0, 1, 0], scaleY: [0.3, 1.4, 0.2], y: [0, -18, -42] }}
              transition={{ duration: 1.05, delay: burst.delay + j * 0.01, repeat: Infinity, repeatDelay: 0.65, ease: "easeOut" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CelebrationLabel({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      className="relative rounded-full border border-amber-300/25 bg-black/30 px-5 py-2 text-center shadow-[0_0_40px_rgba(247,215,116,0.16)] backdrop-blur-md"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: [0.2, 1, 1], scale: [0.82, 1.04, 1] }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      <p className="text-[10px] font-bold tracking-[0.28em] text-amber-200">¡CAMPEONES!</p>
      <p className="mt-1 text-xs text-white/75">Spain celebration mode</p>
    </motion.div>
  );
}

export function SplashScreen() {
  const reduceMotion = useReducedMotion() ?? false;
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFirstVisitRef = useRef(readIsFirstVisit());
  const retryTimeoutsRef = useRef<number[]>([]);
  const celebrationTimeoutRef = useRef<number | null>(null);

  const [visible, setVisible] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isFirstVisit] = useState(readIsFirstVisit);
  const [siteLoaded, setSiteLoaded] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    isFirstVisitRef.current = isFirstVisit;
  }, [isFirstVisit]);

  useEffect(() => {
    if (reduceMotion) {
      window.dispatchEvent(new CustomEvent("wc:splash-dismissed"));
      return;
    }

    fetch("/api/splash")
      .then((r) => r.json())
      .then((data) => {
        if (data.videoPath) {
          setVideoPath(data.videoPath);
          setVisible(true);
        } else {
          window.dispatchEvent(new CustomEvent("wc:splash-dismissed"));
        }
      })
      .catch(() => {
        window.dispatchEvent(new CustomEvent("wc:splash-dismissed"));
      });
  }, [reduceMotion]);

  useEffect(() => {
    const markLoaded = () => setSiteLoaded(true);
    if (document.readyState === "complete") {
      markLoaded();
      return;
    }
    window.addEventListener("load", markLoaded);
    return () => window.removeEventListener("load", markLoaded);
  }, []);

  const clearCelebrationTimer = useCallback(() => {
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      for (const id of retryTimeoutsRef.current) {
        window.clearTimeout(id);
      }
      clearCelebrationTimer();
    };
  }, [clearCelebrationTimer]);

  useEffect(() => {
    if (!visible || !videoPath) return;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const clearRetries = () => {
      for (const id of retryTimeoutsRef.current) {
        window.clearTimeout(id);
      }
      retryTimeoutsRef.current = [];
    };

    const scheduleRetries = () => {
      clearRetries();
      for (const delay of PLAY_RETRY_DELAYS_MS) {
        const id = window.setTimeout(() => {
          if (cancelled || !video.paused) return;
          void attemptPlay(video);
        }, delay);
        retryTimeoutsRef.current.push(id);
      }
    };

    const tryPlay = () => {
      if (cancelled) return;
      void attemptPlay(video).then((playing) => {
        if (!playing && !cancelled) scheduleRetries();
      });
    };

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    tryPlay();

    return () => {
      cancelled = true;
      clearRetries();
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [visible, videoPath]);

  const dismiss = useCallback(() => {
    setCelebrating(false);
    setVisible(false);
    window.dispatchEvent(new CustomEvent("wc:splash-dismissed"));
  }, []);

  const triggerCelebration = useCallback(
    (markFirstVisitComplete: boolean) => {
      if (celebrating) return;
      if (markFirstVisitComplete && isFirstVisitRef.current) {
        localStorage.setItem(FIRST_VISIT_KEY, "1");
        isFirstVisitRef.current = false;
      }

      setCelebrating(true);
      clearCelebrationTimer();
      celebrationTimeoutRef.current = window.setTimeout(() => {
        dismiss();
      }, CELEBRATION_MS);
    },
    [celebrating, clearCelebrationTimer, dismiss]
  );

  const dismissFromClick = useCallback(() => {
    if (isFirstVisitRef.current || !siteLoaded || celebrating) return;
    triggerCelebration(false);
  }, [celebrating, siteLoaded, triggerCelebration]);

  const dismissFromVideoEnd = useCallback(() => {
    triggerCelebration(true);
  }, [triggerCelebration]);

  const blockFirstVisitInteraction = useCallback(
    (event: React.PointerEvent | React.TouchEvent) => {
      if (!isFirstVisitRef.current) return;
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const canSkipByClick = !isFirstVisit && siteLoaded && !celebrating;

  if (!visible || !videoPath) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={celebrating ? "celebration" : "video"}
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
        data-splash-overlay="1"
        onClick={canSkipByClick ? dismissFromClick : undefined}
        onPointerDown={isFirstVisit && !celebrating ? blockFirstVisitInteraction : undefined}
        onTouchEnd={isFirstVisit && !celebrating ? blockFirstVisitInteraction : undefined}
        role="presentation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {celebrating ? (
            <motion.div
              key="celebration-stage"
              className="relative flex h-full w-full max-w-[430px] items-center justify-center"
              initial={{ opacity: 0.8 }}
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : {
                      x: [0, -10, 12, -14, 9, -6, 0],
                      y: [0, 6, -7, 5, -4, 0],
                      rotate: [0, -1.2, 1.4, -1, 0.8, 0],
                      scale: [1, 1.012, 0.992, 1.006, 1],
                    }
              }
              transition={{ duration: 0.95, ease: "easeOut" }}
            >
              <SpainFlagBackdrop reduceMotion={reduceMotion} />
              <Fireworks reduceMotion={reduceMotion} />
              <motion.div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_52%)]"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={reduceMotion ? { opacity: 0.45, scale: 1 } : { opacity: [0, 0.95, 0], scale: [0.4, 1.1, 1.4] }}
                transition={{ duration: 1.05, ease: "easeOut" }}
              />
              <motion.div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.42))]"
                animate={reduceMotion ? { opacity: 1 } : { opacity: [0.2, 0.65, 0.35] }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <CelebrationLabel reduceMotion={reduceMotion} />
              <motion.div
                className="pointer-events-none absolute bottom-7 text-[10px] tracking-[0.22em] text-white/50"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 }}
              >
                لمس برای ادامه
              </motion.div>
            </motion.div>
          ) : (
            <motion.video
              key="splash-video"
              ref={videoRef}
              src={videoPath}
              className="pointer-events-none h-full w-full max-w-[430px] object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              controls={false}
              disablePictureInPicture
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onEnded={dismissFromVideoEnd}
            />
          )}
        </AnimatePresence>
        {canSkipByClick && !celebrating && (
          <p className="absolute bottom-8 text-xs text-white/50">برای رد کردن لمس کنید</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
