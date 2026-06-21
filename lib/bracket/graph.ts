import { BracketStage } from "@/generated/prisma";
import { BRACKET_STAGES } from "./constants";
import type { BracketMatchNode } from "./types";

export type BracketValidationError = {
  code: string;
  message: string;
  matchId?: string;
};

export function validateBracketGraph(matches: BracketMatchNode[]): BracketValidationError[] {
  const errors: BracketValidationError[] = [];
  const byId = new Map(matches.map((m) => [m.id, m]));
  const positionKeys = new Set<string>();

  for (const m of matches) {
    const key = `${m.stage}:${m.position}`;
    if (positionKeys.has(key)) {
      errors.push({
        code: "DUPLICATE_POSITION",
        message: `موقعیت تکراری در ${m.stage} position ${m.position}`,
        matchId: m.id,
      });
    }
    positionKeys.add(key);

    if (m.homeTeamId && m.awayTeamId && m.homeTeamId === m.awayTeamId) {
      errors.push({
        code: "SAME_TEAM_BOTH_SLOTS",
        message: "یک تیم در هر دو جایگاه یک مسابقه قرار گرفته است.",
        matchId: m.id,
      });
    }

    for (const sourceId of [m.homeSourceMatchId, m.awaySourceMatchId]) {
      if (sourceId && !byId.has(sourceId)) {
        errors.push({
          code: "MISSING_SOURCE",
          message: "مسابقه مبدأ یافت نشد.",
          matchId: m.id,
        });
      }
    }

    if (m.nextMatchId && !byId.has(m.nextMatchId)) {
      errors.push({
        code: "MISSING_NEXT",
        message: "مسابقه بعدی یافت نشد.",
        matchId: m.id,
      });
    }
  }

  const r32 = matches.filter((m) => m.stage === BracketStage.ROUND_OF_32);
  for (const m of r32) {
    if (!m.homeTeamId || !m.awayTeamId) {
      errors.push({
        code: "INCOMPLETE_R32",
        message: "همه مسابقات یک‌شانزدهم باید دو تیم اولیه داشته باشند.",
        matchId: m.id,
      });
    }
  }

  for (const m of matches) {
    if (m.stage === BracketStage.ROUND_OF_32) continue;
    const hasHome = m.homeTeamId || m.homeSourceMatchId;
    const hasAway = m.awayTeamId || m.awaySourceMatchId;
    if (!hasHome || !hasAway) {
      errors.push({
        code: "MISSING_FEEDER",
        message: "مسابقه بدون منبع تیم در مراحل بعدی.",
        matchId: m.id,
      });
    }
  }

  for (const m of matches) {
    if (detectCycle(m.id, byId, new Set())) {
      errors.push({
        code: "CYCLE",
        message: "حلقه در ارتباط مسابقات تشخیص داده شد.",
        matchId: m.id,
      });
      break;
    }
  }

  return errors;
}

function detectCycle(
  startId: string,
  byId: Map<string, BracketMatchNode>,
  visiting: Set<string>
): boolean {
  if (visiting.has(startId)) return true;
  const m = byId.get(startId);
  if (!m?.nextMatchId) return false;
  visiting.add(startId);
  const cycle = detectCycle(m.nextMatchId, byId, visiting);
  visiting.delete(startId);
  return cycle;
}

export function isGraphValid(matches: BracketMatchNode[]): boolean {
  return validateBracketGraph(matches).length === 0;
}

export function getStageOrder(): BracketStage[] {
  return [...BRACKET_STAGES];
}
