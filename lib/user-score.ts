import { PointRuleKey } from "@/generated/prisma";

export type UserScoreInput = {
  basePointsAwarded: boolean;
  correctCount: number;
  wrongCount: number;
  referralCount: number;
};

export type PointRulesMap = Map<PointRuleKey, number>;

export function computeUserScore(user: UserScoreInput, rules: PointRulesMap): number {
  let score = 0;
  if (user.basePointsAwarded) {
    score += rules.get(PointRuleKey.BASE_REGISTRATION) ?? 0;
  }
  score += user.correctCount * (rules.get(PointRuleKey.CORRECT_PREDICTION) ?? 0);
  score += user.wrongCount * (rules.get(PointRuleKey.WRONG_PREDICTION) ?? 0);
  score += user.referralCount * (rules.get(PointRuleKey.REFERRAL_SUCCESS) ?? 0);
  return score;
}

export async function loadActivePointRulesMap(): Promise<PointRulesMap> {
  const { getActivePointRules } = await import("@/lib/points");
  return getActivePointRules([
    PointRuleKey.BASE_REGISTRATION,
    PointRuleKey.CORRECT_PREDICTION,
    PointRuleKey.WRONG_PREDICTION,
    PointRuleKey.REFERRAL_SUCCESS,
  ]);
}
