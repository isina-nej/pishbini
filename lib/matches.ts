import { MatchStatus } from "@/generated/prisma";

export function getMatchAvailabilityWindow(now = new Date()) {
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return { now, windowEnd };
}

export function isMatchAvailableForPrediction(
  match: { startTime: Date; status: MatchStatus },
  now = new Date()
): boolean {
  const { windowEnd } = getMatchAvailabilityWindow(now);
  return (
    match.startTime > now &&
    match.startTime <= windowEnd &&
    (match.status === MatchStatus.SCHEDULED || match.status === MatchStatus.ACTIVE)
  );
}

export function isMatchLocked(
  match: { startTime: Date; status: MatchStatus },
  now = new Date()
): boolean {
  return (
    now >= match.startTime ||
    match.status === MatchStatus.LOCKED ||
    match.status === MatchStatus.FINISHED ||
    match.status === MatchStatus.CANCELLED
  );
}

export const availableMatchWhere = (now = new Date()) => {
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    startTime: { gt: now, lte: windowEnd },
    status: { in: [MatchStatus.SCHEDULED, MatchStatus.ACTIVE] as MatchStatus[] },
  };
};
