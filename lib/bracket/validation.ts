import { BracketStage } from "@/generated/prisma";
import { BRACKET_STAGES } from "./constants";
import {
  deriveChampion,
  isBracketComplete,
  matchesInStageOrder,
  resolveMatchTeams,
  buildMatchMap,
} from "./progression";
import type { BracketPicks, BracketTree } from "./types";

export function validateFullBracket(
  picks: BracketPicks,
  tree: BracketTree
): { valid: true } | { valid: false; error: string } {
  const matchMap = buildMatchMap(tree);

  for (const match of matchesInStageOrder(tree)) {
    const resolved = resolveMatchTeams(match, picks, matchMap, tree.teams);
    const winner = picks[match.id];

    if (!resolved.isReady) {
      if (winner) {
        return { valid: false, error: "پیش‌بینی برای مسابقه‌ای با تیم نامشخص ثبت شده است." };
      }
      continue;
    }

    if (!winner) {
      return { valid: false, error: "همه مسابقات تکمیل نشده‌اند." };
    }

    if (winner !== resolved.homeTeamId && winner !== resolved.awayTeamId) {
      return {
        valid: false,
        error: "برنده انتخاب‌شده با تیم‌های مسابقه مطابقت ندارد.",
      };
    }
  }

  if (!isBracketComplete(picks, tree)) {
    return { valid: false, error: "جدول حذفی کامل نیست." };
  }

  const champion = deriveChampion(picks, tree);
  if (!champion) {
    return { valid: false, error: "قهرمان مشخص نشده است." };
  }

  return { valid: true };
}

export function validateChampionMatchesFinal(
  picks: BracketPicks,
  tree: BracketTree,
  championTeamId: string
): boolean {
  const champion = deriveChampion(picks, tree);
  return champion?.id === championTeamId;
}

export function countRequiredMatches(tree: BracketTree): number {
  return tree.matches.filter((m) => {
    const hasHome = m.homeTeamId || m.homeSourceMatchId;
    const hasAway = m.awayTeamId || m.awaySourceMatchId;
    return hasHome && hasAway;
  }).length;
}

export function isStageValid(stage: string): stage is BracketStage {
  return BRACKET_STAGES.includes(stage as BracketStage);
}
