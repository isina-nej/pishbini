import { BracketStage } from "@/generated/prisma";
import { BRACKET_STAGES, BRACKET_TOTAL_PICKS, MATCHES_PER_STAGE } from "./constants";
import type {
  BracketMatchNode,
  BracketPicks,
  BracketProgress,
  BracketTeam,
  BracketTree,
  ResolvedMatch,
} from "./types";

export function buildMatchMap(tree: BracketTree): Map<string, BracketMatchNode> {
  return new Map(tree.matches.map((m) => [m.id, m]));
}

export function getMatchesByStage(
  tree: BracketTree,
  stage: BracketStage
): BracketMatchNode[] {
  return tree.matches
    .filter((m) => m.stage === stage)
    .sort((a, b) => a.position - b.position);
}

export function matchesInStageOrder(tree: BracketTree): BracketMatchNode[] {
  const ordered: BracketMatchNode[] = [];
  for (const stage of BRACKET_STAGES) {
    ordered.push(...getMatchesByStage(tree, stage));
  }
  return ordered;
}

function resolveTeamId(
  seedTeamId: string | null,
  sourceMatchId: string | null,
  picks: BracketPicks,
  matchMap: Map<string, BracketMatchNode>
): string | null {
  if (seedTeamId) return seedTeamId;
  if (!sourceMatchId) return null;
  const winnerId = picks[sourceMatchId];
  if (!winnerId) return null;
  const source = matchMap.get(sourceMatchId);
  if (!source) return null;
  const sourceResolved = resolveMatchTeams(source, picks, matchMap, treeTeamsPlaceholder);
  void sourceResolved;
  return winnerId;
}

const treeTeamsPlaceholder: Record<string, BracketTeam> = {};

export function resolveMatchTeams(
  match: BracketMatchNode,
  picks: BracketPicks,
  matchMap: Map<string, BracketMatchNode>,
  teams: Record<string, BracketTeam>
): ResolvedMatch {
  const homeTeamId = resolveTeamId(
    match.homeTeamId,
    match.homeSourceMatchId,
    picks,
    matchMap
  );
  const awayTeamId = resolveTeamId(
    match.awayTeamId,
    match.awaySourceMatchId,
    picks,
    matchMap
  );

  const homeTeam = homeTeamId ? teams[homeTeamId] ?? null : null;
  const awayTeam = awayTeamId ? teams[awayTeamId] ?? null : null;
  const winnerTeamId = picks[match.id] ?? null;
  const isReady = Boolean(homeTeamId && awayTeamId && homeTeamId !== awayTeamId);

  return {
    matchId: match.id,
    stage: match.stage,
    position: match.position,
    homeTeam,
    awayTeam,
    homeTeamId,
    awayTeamId,
    winnerTeamId,
    isReady,
  };
}

export function resolveAllMatches(tree: BracketTree, picks: BracketPicks): ResolvedMatch[] {
  const matchMap = buildMatchMap(tree);
  return matchesInStageOrder(tree).map((m) =>
    resolveMatchTeams(m, picks, matchMap, tree.teams)
  );
}

export function sanitizePicks(picks: BracketPicks, tree: BracketTree): BracketPicks {
  const matchMap = buildMatchMap(tree);
  const next: BracketPicks = { ...picks };

  for (const match of matchesInStageOrder(tree)) {
    const resolved = resolveMatchTeams(match, next, matchMap, tree.teams);
    if (!resolved.isReady) {
      delete next[match.id];
      continue;
    }
    const winner = next[match.id];
    if (
      winner &&
      winner !== resolved.homeTeamId &&
      winner !== resolved.awayTeamId
    ) {
      delete next[match.id];
    }
  }

  return next;
}

export function selectWinner(
  picks: BracketPicks,
  tree: BracketTree,
  matchId: string,
  teamId: string
): BracketPicks {
  const matchMap = buildMatchMap(tree);
  const match = matchMap.get(matchId);
  if (!match) return picks;

  const resolved = resolveMatchTeams(match, picks, matchMap, tree.teams);
  if (!resolved.isReady) return picks;
  if (teamId !== resolved.homeTeamId && teamId !== resolved.awayTeamId) return picks;

  const updated = { ...picks, [matchId]: teamId };
  return sanitizePicks(updated, tree);
}

export function clearPick(picks: BracketPicks, tree: BracketTree, matchId: string): BracketPicks {
  const next = { ...picks };
  delete next[matchId];
  return sanitizePicks(next, tree);
}

export function computeProgress(picks: BracketPicks, tree: BracketTree): BracketProgress {
  const matchMap = buildMatchMap(tree);
  let completed = 0;
  for (const match of matchesInStageOrder(tree)) {
    const resolved = resolveMatchTeams(match, picks, matchMap, tree.teams);
    if (resolved.isReady && picks[match.id]) completed++;
  }
  return { completed, total: BRACKET_TOTAL_PICKS };
}

export function isBracketComplete(picks: BracketPicks, tree: BracketTree): boolean {
  const progress = computeProgress(picks, tree);
  return progress.completed === progress.total;
}

export function deriveChampion(
  picks: BracketPicks,
  tree: BracketTree
): BracketTeam | null {
  const finalMatches = getMatchesByStage(tree, BracketStage.FINAL);
  if (finalMatches.length === 0) return null;
  const finalMatch = finalMatches[0];
  const winnerId = picks[finalMatch.id];
  if (!winnerId) return null;
  return tree.teams[winnerId] ?? null;
}

export function getStageCompletion(
  picks: BracketPicks,
  tree: BracketTree,
  stage: BracketStage
): { completed: number; total: number } {
  const matchMap = buildMatchMap(tree);
  const stageMatches = getMatchesByStage(tree, stage);
  let completed = 0;
  for (const match of stageMatches) {
    const resolved = resolveMatchTeams(match, picks, matchMap, tree.teams);
    if (resolved.isReady && picks[match.id]) completed++;
  }
  return { completed, total: MATCHES_PER_STAGE[stage] };
}

export function getDownstreamMatchIds(
  matchId: string,
  tree: BracketTree
): string[] {
  const downstream = new Set<string>();
  const queue = [matchId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const m of tree.matches) {
      if (
        (m.homeSourceMatchId === current || m.awaySourceMatchId === current) &&
        !downstream.has(m.id)
      ) {
        downstream.add(m.id);
        queue.push(m.id);
      }
    }
  }

  return Array.from(downstream);
}
