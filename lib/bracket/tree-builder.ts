import { BracketSlot, BracketStage } from "@/generated/prisma";
import type { BracketMatchNode } from "./types";

/** Build linkage metadata for a standard 16-team knockout tree (31 matches). */
export function buildStandardTreeLinks(): Omit<
  BracketMatchNode,
  "homeTeamId" | "awayTeamId"
>[] {
  const nodes: Omit<BracketMatchNode, "homeTeamId" | "awayTeamId">[] = [];
  const ids: Record<string, string> = {};

  const stageCounts: [BracketStage, number][] = [
    [BracketStage.ROUND_OF_32, 16],
    [BracketStage.ROUND_OF_16, 8],
    [BracketStage.QUARTER_FINAL, 4],
    [BracketStage.SEMI_FINAL, 2],
    [BracketStage.FINAL, 1],
  ];

  for (const [stage, count] of stageCounts) {
    for (let pos = 0; pos < count; pos++) {
      const id = `${stage}_${pos}`;
      ids[`${stage}:${pos}`] = id;
      nodes.push({
        id,
        stage,
        position: pos,
        homeSourceMatchId: null,
        awaySourceMatchId: null,
        nextMatchId: null,
        nextMatchSlot: null,
      });
    }
  }

  const linkRound = (
    from: BracketStage,
    fromCount: number,
    to: BracketStage,
    toCount: number
  ) => {
    for (let i = 0; i < toCount; i++) {
      const toId = ids[`${to}:${i}`];
      const homeFrom = ids[`${from}:${i * 2}`];
      const awayFrom = ids[`${from}:${i * 2 + 1}`];
      const toNode = nodes.find((n) => n.id === toId)!;
      toNode.homeSourceMatchId = homeFrom;
      toNode.awaySourceMatchId = awayFrom;
      const homeFromNode = nodes.find((n) => n.id === homeFrom)!;
      const awayFromNode = nodes.find((n) => n.id === awayFrom)!;
      homeFromNode.nextMatchId = toId;
      homeFromNode.nextMatchSlot = BracketSlot.HOME;
      awayFromNode.nextMatchId = toId;
      awayFromNode.nextMatchSlot = BracketSlot.AWAY;
    }
  };

  linkRound(BracketStage.ROUND_OF_32, 16, BracketStage.ROUND_OF_16, 8);
  linkRound(BracketStage.ROUND_OF_16, 8, BracketStage.QUARTER_FINAL, 4);
  linkRound(BracketStage.QUARTER_FINAL, 4, BracketStage.SEMI_FINAL, 2);
  linkRound(BracketStage.SEMI_FINAL, 2, BracketStage.FINAL, 1);

  return nodes;
}

export function assignR32Teams(
  nodes: Omit<BracketMatchNode, "homeTeamId" | "awayTeamId">[],
  teamIds: string[]
): BracketMatchNode[] {
  if (teamIds.length < 32) {
    throw new Error("Need 32 teams for Round of 32");
  }
  const r32 = nodes.filter((n) => n.stage === BracketStage.ROUND_OF_32);
  return nodes.map((n) => {
    const idx = r32.findIndex((r) => r.id === n.id);
    if (idx === -1) return { ...n, homeTeamId: null, awayTeamId: null };
    return {
      ...n,
      homeTeamId: teamIds[idx * 2] ?? null,
      awayTeamId: teamIds[idx * 2 + 1] ?? null,
    };
  });
}
