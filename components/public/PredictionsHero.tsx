"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export const PREDICTIONS_HERO_HEIGHT = "min(42vh, 300px)";

const FADE_DISTANCE = 220;
const HERO_IMAGE = "/photo/IMG_3790.PNG";

export function PredictionsHero() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [0, FADE_DISTANCE], [1, 0]);
  const translateY = useTransform(scrollY, [0, FADE_DISTANCE], [0, FADE_DISTANCE * 0.35]);
  const scale = useTransform(scrollY, [0, FADE_DISTANCE], [1, 1.08]);

  return (
    <div
      className="predictions-hero-layer pointer-events-none fixed inset-x-0 top-0 z-0 mx-auto h-[var(--predictions-hero-height)] w-full max-w-[430px] overflow-hidden"
      aria-hidden
      data-hero-src={HERO_IMAGE}
    >
      <motion.div
        className="relative size-full"
        style={reduceMotion ? { opacity: 1 } : { opacity, y: translateY, scale }}
      >
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="430px"
            className="object-cover object-[center_68%]"
          />
        </div>
        <div className="predictions-hero-fade absolute inset-0" />
      </motion.div>
    </div>
  );
}
