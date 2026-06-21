import { BracketSlot, BracketStage } from "@/generated/prisma";

export type BracketTeam = {
  id: string;
  nameFa: string;
  nameEn: string;
  code: string;
  flagUrl: string;
};

export type BracketMatchNode = {
  id: string;
  stage: BracketStage;
  position: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSourceMatchId: string | null;
  awaySourceMatchId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: BracketSlot | null;
};

export type BracketTree = {
  matches: BracketMatchNode[];
  teams: Record<string, BracketTeam>;
};

export type BracketPicks = Record<string, string>;

export type ResolvedMatch = {
  matchId: string;
  stage: BracketStage;
  position: number;
  homeTeam: BracketTeam | null;
  awayTeam: BracketTeam | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
  isReady: boolean;
};

export type BracketProgress = {
  completed: number;
  total: number;
};

export type BracketDraft = {
  version: 1;
  picks: BracketPicks;
  updatedAt: string;
};

export type BracketConfig = {
  enabled: boolean;
  published: boolean;
  submissionOpen: boolean;
  version: string;
};
