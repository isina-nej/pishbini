"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const FIRST_VISIT_KEY = "wc_splash_first_visit_done";

export function SplashScreen() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [siteLoaded, setSiteLoaded] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    setIsFirstVisit(!localStorage.getItem(FIRST_VISIT_KEY));

    fetch("/api/splash")
      .then((r) => r.json())
      .then((data) => {
        if (data.videoPath) {
          setVideoPath(data.videoPath);
          setVisible(true);
        }
      })
      .catch(() => {});
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

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const dismissFromClick = useCallback(() => {
    if (isFirstVisit || !siteLoaded) return;
    dismiss();
  }, [dismiss, isFirstVisit, siteLoaded]);

  const dismissFromVideoEnd = useCallback(() => {
    if (isFirstVisit) {
      localStorage.setItem(FIRST_VISIT_KEY, "1");
    }
    dismiss();
  }, [dismiss, isFirstVisit]);

  const canSkipByClick = !isFirstVisit && siteLoaded;

  if (!visible || !videoPath) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      onClick={dismissFromClick}
      role="presentation"
    >
      <video
        ref={videoRef}
        src={videoPath}
        className="h-full w-full max-w-[430px] object-cover"
        autoPlay
        muted
        playsInline
        onEnded={dismissFromVideoEnd}
      />
      {canSkipByClick && (
        <p className="absolute bottom-8 text-xs text-white/50">برای رد کردن لمس کنید</p>
      )}
    </div>
  );
}
