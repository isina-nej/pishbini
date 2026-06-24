"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const FIRST_VISIT_KEY = "wc_splash_first_visit_done";
const PLAY_RETRY_DELAYS_MS = [100, 300, 600] as const;

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

export function SplashScreen() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFirstVisitRef = useRef(readIsFirstVisit());
  const retryTimeoutsRef = useRef<number[]>([]);

  const [visible, setVisible] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isFirstVisit] = useState(readIsFirstVisit);
  const [siteLoaded, setSiteLoaded] = useState(false);

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
    setVisible(false);
    window.dispatchEvent(new CustomEvent("wc:splash-dismissed"));
  }, []);

  const dismissFromClick = useCallback(() => {
    if (isFirstVisitRef.current || !siteLoaded) return;
    dismiss();
  }, [dismiss, siteLoaded]);

  const dismissFromVideoEnd = useCallback(() => {
    if (isFirstVisitRef.current) {
      localStorage.setItem(FIRST_VISIT_KEY, "1");
      isFirstVisitRef.current = false;
    }
    dismiss();
  }, [dismiss]);

  const blockFirstVisitInteraction = useCallback(
    (event: React.PointerEvent | React.TouchEvent) => {
      if (!isFirstVisitRef.current) return;
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const canSkipByClick = !isFirstVisit && siteLoaded;

  if (!visible || !videoPath) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      data-splash-overlay="1"
      onClick={canSkipByClick ? dismissFromClick : undefined}
      onPointerDown={isFirstVisit ? blockFirstVisitInteraction : undefined}
      onTouchEnd={isFirstVisit ? blockFirstVisitInteraction : undefined}
      role="presentation"
    >
      <video
        key={videoPath}
        ref={videoRef}
        src={videoPath}
        className="pointer-events-none h-full w-full max-w-[430px] object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onEnded={dismissFromVideoEnd}
      />
      {canSkipByClick && (
        <p className="absolute bottom-8 text-xs text-white/50">برای رد کردن لمس کنید</p>
      )}
    </div>
  );
}
