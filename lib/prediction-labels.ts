import { PredictionChoice } from "@/generated/prisma";

export function formatPredictionChoice(
  choice: PredictionChoice,
  homeNameFa: string,
  awayNameFa: string
): string {
  switch (choice) {
    case PredictionChoice.HOME_WIN:
      return `برد ${homeNameFa}`;
    case PredictionChoice.AWAY_WIN:
      return `برد ${awayNameFa}`;
    case PredictionChoice.DRAW:
      return "مساوی";
    default:
      return choice;
  }
}

export function formatPredictionResult(isCorrect: boolean | null, pointsAwarded: number): string {
  if (isCorrect === null) return "در انتظار نتیجه";
  if (isCorrect) return `درست (+${pointsAwarded.toLocaleString("fa-IR")})`;
  return pointsAwarded > 0
    ? `نادرست (+${pointsAwarded.toLocaleString("fa-IR")})`
    : "نادرست";
}
