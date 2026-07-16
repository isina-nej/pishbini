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

export function parseTeamNamesFromMatchLabel(matchLabel: string): {
  homeNameFa: string;
  awayNameFa: string;
} | null {
  const parts = matchLabel.split(/\s*[–-]\s*/);
  if (parts.length !== 2) return null;
  const homeNameFa = parts[0]?.trim();
  const awayNameFa = parts[1]?.trim();
  if (!homeNameFa || !awayNameFa) return null;
  return { homeNameFa, awayNameFa };
}

export function resolveMatchTeamNames(input: {
  matchLabel: string;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
}): { homeNameFa: string; awayNameFa: string } {
  const fromLabel = parseTeamNamesFromMatchLabel(input.matchLabel);
  return {
    homeNameFa: input.homeTeamName?.trim() || fromLabel?.homeNameFa || "",
    awayNameFa: input.awayTeamName?.trim() || fromLabel?.awayNameFa || "",
  };
}

export function getMatchOutcomeOptions(homeNameFa: string, awayNameFa: string) {
  return [
    {
      value: PredictionChoice.HOME_WIN,
      label: formatPredictionChoice(PredictionChoice.HOME_WIN, homeNameFa, awayNameFa),
    },
    {
      value: PredictionChoice.AWAY_WIN,
      label: formatPredictionChoice(PredictionChoice.AWAY_WIN, homeNameFa, awayNameFa),
    },
  ];
}

export function formatPredictionResult(isCorrect: boolean | null, pointsAwarded: number): string {
  if (isCorrect === null) return "در انتظار نتیجه";
  if (isCorrect) return `درست (+${pointsAwarded.toLocaleString("fa-IR")})`;
  return pointsAwarded > 0
    ? `نادرست (+${pointsAwarded.toLocaleString("fa-IR")})`
    : "نادرست";
}
