import { PredictionChoice } from "@/generated/prisma";

export function outcomeFromScores(
  homeScore: number,
  awayScore: number
): PredictionChoice {
  if (homeScore > awayScore) return PredictionChoice.HOME_WIN;
  if (homeScore < awayScore) return PredictionChoice.AWAY_WIN;
  return PredictionChoice.DRAW;
}

export function isScoreOutcomeMismatch(
  correctPrediction: PredictionChoice,
  homeScore: number | null,
  awayScore: number | null
): boolean {
  if (homeScore === null || awayScore === null) return false;
  return outcomeFromScores(homeScore, awayScore) !== correctPrediction;
}
