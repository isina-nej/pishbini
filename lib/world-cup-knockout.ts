/**
 * FIFA World Cup 2026 — Round of 32 (matches 73–88).
 * Kickoffs from FIFA / confirmed media schedules; stored as UTC.
 */

import type { WcFixture } from "./world-cup-2026";

/** Local wall time with fixed UTC offset (e.g. -7 for PDT) → UTC ISO */
export function wcKickoffFromOffset(
  month: number,
  day: number,
  hourLocal: number,
  minuteLocal: number,
  utcOffsetHours: number
): string {
  const totalMinutes = hourLocal * 60 + minuteLocal - utcOffsetHours * 60;
  const d = new Date(Date.UTC(2026, month - 1, day, 0, 0, 0));
  d.setUTCMinutes(d.getUTCMinutes() + totalMinutes);
  return d.toISOString();
}

/** Round of 32 — teams confirmed as of late June 2026 group stage */
export const WC2026_ROUND_OF_32: WcFixture[] = [
  // 28 Jun — Los Angeles (PDT, UTC−7)
  {
    group: "R32",
    matchday: 1,
    homeCode: "RSA",
    awayCode: "CAN",
    startTime: wcKickoffFromOffset(6, 28, 12, 0, -7),
  },
  // 29 Jun
  {
    group: "R32",
    matchday: 1,
    homeCode: "BRA",
    awayCode: "JPN",
    startTime: wcKickoffFromOffset(6, 29, 12, 0, -5),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "GER",
    awayCode: "PAR",
    startTime: wcKickoffFromOffset(6, 29, 16, 30, -4),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "NED",
    awayCode: "MAR",
    startTime: wcKickoffFromOffset(6, 29, 19, 0, -6),
  },
  // 30 Jun
  {
    group: "R32",
    matchday: 1,
    homeCode: "CIV",
    awayCode: "NOR",
    startTime: wcKickoffFromOffset(6, 30, 12, 0, -5),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "FRA",
    awayCode: "SWE",
    startTime: wcKickoffFromOffset(6, 30, 17, 0, -4),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "MEX",
    awayCode: "ECU",
    startTime: wcKickoffFromOffset(6, 30, 19, 0, -5),
  },
  // 1 Jul
  {
    group: "R32",
    matchday: 1,
    homeCode: "ENG",
    awayCode: "COD",
    startTime: wcKickoffFromOffset(7, 1, 12, 0, -4),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "BEL",
    awayCode: "SEN",
    startTime: wcKickoffFromOffset(7, 1, 13, 0, -7),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "USA",
    awayCode: "BIH",
    startTime: wcKickoffFromOffset(7, 1, 17, 0, -7),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "POR",
    awayCode: "CRO",
    startTime: wcKickoffFromOffset(7, 1, 19, 0, -4),
  },
  // 2 Jul
  {
    group: "R32",
    matchday: 1,
    homeCode: "ESP",
    awayCode: "AUT",
    startTime: wcKickoffFromOffset(7, 2, 12, 0, -7),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "SUI",
    awayCode: "ALG",
    startTime: wcKickoffFromOffset(7, 2, 20, 0, -7),
  },
  // 3 Jul
  {
    group: "R32",
    matchday: 1,
    homeCode: "AUS",
    awayCode: "EGY",
    startTime: wcKickoffFromOffset(7, 3, 13, 0, -5),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "ARG",
    awayCode: "CPV",
    startTime: wcKickoffFromOffset(7, 3, 18, 0, -4),
  },
  {
    group: "R32",
    matchday: 1,
    homeCode: "COL",
    awayCode: "GHA",
    startTime: wcKickoffFromOffset(7, 3, 20, 30, -5),
  },
];
