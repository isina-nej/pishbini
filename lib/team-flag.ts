/** Local flag assets — avoids Next.js image optimizer + blocked CDNs on Iranian servers. */
export function localFlagPath(code: string): string {
  return `/flags/${code.toLowerCase()}.png`;
}

export function flagUrlForTeam(code: string): string {
  return localFlagPath(code);
}

export function withLocalFlag<T extends { code: string; flagUrl?: string }>(team: T): T & { flagUrl: string } {
  return { ...team, flagUrl: localFlagPath(team.code) };
}
