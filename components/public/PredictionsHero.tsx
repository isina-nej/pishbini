"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export const PREDICTIONS_HERO_HEIGHT = "min(42vh, 300px)";

const FADE_DISTANCE = 220;
const ROTATE_MS = 5000;
// new filenames force browser/_next/image cache refresh after asset overwrite
const HERO_IMAGES = ["/photo/banner-1.png", "/photo/banner-2.png"] as const;

export function PredictionsHero() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  // SSR + first paint always start at 0 → no hydration mismatch
  const [index, setIndex] = useState(0);

  const opacity = useTransform(scrollY, [0, FADE_DISTANCE], [1, 0]);
  const translateY = useTransform(scrollY, [0, FADE_DISTANCE], [0, FADE_DISTANCE * 0.35]);
  const scale = useTransform(scrollY, [0, FADE_DISTANCE], [1, 1.08]);

  useEffect(() => {
    if (HERO_IMAGES.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const src = HERO_IMAGES[index];

  return (
    <div
      className="predictions-hero-layer pointer-events-none fixed inset-x-0 top-0 z-0 mx-auto h-[var(--predictions-hero-height)] w-full max-w-[430px] overflow-hidden"
      aria-hidden
      data-hero-src={src}
    >
      <motion.div
        className="relative size-full"
        style={reduceMotion ? { opacity: 1 } : { opacity, y: translateY, scale }}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={src}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={index === 0}
              sizes="430px"
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
        <div className="predictions-hero-fade absolute inset-0" />
      </motion.div>
    </div>
  );
}
