/** ISO 3166 codes used by flag-icons for each FIFA team code. */
export const TEAM_FLAG_ISO: Record<string, string> = {
  IRI: "ir",
  POR: "pt",
  ARG: "ar",
  BRA: "br",
  FRA: "fr",
  ESP: "es",
  GER: "de",
  ENG: "gb-eng",
  BEL: "be",
  NED: "nl",
  CRO: "hr",
  MAR: "ma",
  JPN: "jp",
  MEX: "mx",
  USA: "us",
  URU: "uy",
  SUI: "ch",
  DEN: "dk",
  POL: "pl",
  KOR: "kr",
  AUS: "au",
  ECU: "ec",
  SEN: "sn",
  WAL: "gb-wls",
  CMR: "cm",
  SRB: "rs",
  GHA: "gh",
  CRC: "cr",
  TUN: "tn",
  KSA: "sa",
  CAN: "ca",
  ITA: "it",
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
