import { BracketStage } from "@/generated/prisma";

export const BRACKET_DRAFT_KEY = "world-cup-bracket-draft-v1";
export const BRACKET_DRAFT_VERSION = 1;
export const BRACKET_TOTAL_PICKS = 31;

export const BRACKET_STAGES: BracketStage[] = [
  BracketStage.ROUND_OF_32,
  BracketStage.ROUND_OF_16,
  BracketStage.QUARTER_FINAL,
  BracketStage.SEMI_FINAL,
  BracketStage.FINAL,
];

export const STAGE_LABELS: Record<BracketStage, string> = {
  [BracketStage.ROUND_OF_32]: "یک‌شانزدهم",
  [BracketStage.ROUND_OF_16]: "یک‌هشتم",
  [BracketStage.QUARTER_FINAL]: "یک‌چهارم",
  [BracketStage.SEMI_FINAL]: "نیمه‌نهایی",
  [BracketStage.FINAL]: "فینال",
};

export const STAGE_LABELS_FULL: Record<BracketStage, string> = {
  [BracketStage.ROUND_OF_32]: "مرحله یک‌شانزدهم نهایی",
  [BracketStage.ROUND_OF_16]: "مرحله یک‌هشتم نهایی",
  [BracketStage.QUARTER_FINAL]: "مرحله یک‌چهارم نهایی",
  [BracketStage.SEMI_FINAL]: "مرحله نیمه‌نهایی",
  [BracketStage.FINAL]: "فینال",
};

export const STAGE_TAB_SHORT: Record<BracketStage, string> = {
  [BracketStage.ROUND_OF_32]: "۳۲ تیم",
  [BracketStage.ROUND_OF_16]: "۱۶ تیم",
  [BracketStage.QUARTER_FINAL]: "یک‌چهارم",
  [BracketStage.SEMI_FINAL]: "نیمه‌نهایی",
  [BracketStage.FINAL]: "فینال",
};

export const MATCHES_PER_STAGE: Record<BracketStage, number> = {
  [BracketStage.ROUND_OF_32]: 16,
  [BracketStage.ROUND_OF_16]: 8,
  [BracketStage.QUARTER_FINAL]: 4,
  [BracketStage.SEMI_FINAL]: 2,
  [BracketStage.FINAL]: 1,
};
