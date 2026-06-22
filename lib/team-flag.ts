/** ISO 3166 codes used by flag-icons for each FIFA team code. */
export const TEAM_FLAG_ISO: Record<string, string> = {
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  IRI: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
};

export function flagIsoForTeam(code: string): string {
  return TEAM_FLAG_ISO[code.toUpperCase()] ?? code.toLowerCase();
}

/** Vector flag assets — sharp at any card size, no CDN dependency. */
export function localFlagPath(code: string): string {
  return `/flags/${code.toLowerCase()}.svg`;
}

export function flagUrlForTeam(code: string): string {
  return localFlagPath(code);
}

export function withLocalFlag<T extends { code: string; flagUrl?: string }>(
  team: T
): T & { flagUrl: string } {
  return { ...team, flagUrl: localFlagPath(team.code) };
}
