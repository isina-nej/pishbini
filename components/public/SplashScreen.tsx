"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const SEEN_KEY = "wc_splash_seen";

export function SplashScreen() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY)) return;

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

  const dismiss = () => {
    sessionStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  if (!visible || !videoPath) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      onClick={dismiss}
      role="presentation"
    >
      <video
        ref={videoRef}
        src={videoPath}
        className="h-full w-full max-w-[430px] object-cover"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
      />
      <p className="absolute bottom-8 text-xs text-white/50">برای رد کردن لمس کنید</p>
    </div>
  );
}
