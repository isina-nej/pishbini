"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export const PREDICTIONS_HERO_HEIGHT = "min(42vh, 300px)";

const FADE_DISTANCE = 220;

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
    >
      <motion.div
        className="relative size-full"
        style={
          reduceMotion
            ? { opacity: 1 }
            : { opacity, y: translateY, scale }
        }
      >
        <Image
          src="/photo/image.png"
          alt=""
          fill
          priority
          sizes="430px"
          className="object-cover object-center"
        />
        <div className="predictions-hero-fade absolute inset-0" />
      </motion.div>
    </div>
  );
}
