/**
 * FIFA World Cup 2026 — 48 teams, 12 groups, 72 group-stage fixtures.
 * Kickoffs in US Eastern Daylight Time (UTC−4); stored as UTC ISO strings.
 */

export type WcTeam = {
  code: string;
  nameEn: string;
  nameFa: string;
  group: string;
};

export type WcFixture = {
  homeCode: string;
  awayCode: string;
  /** UTC ISO 8601 */
  startTime: string;
  group: string;
  matchday: 1 | 2 | 3;
};
export function wcKickoffUtc(monthDay: number, hourEt: number, minuteEt = 0): string {
  const d = new Date(Date.UTC(2026, 5, monthDay, hourEt + 4, minuteEt, 0));
  return d.toISOString();
}

export const WC2026_TEAMS: WcTeam[] = [
  { code: "MEX", nameEn: "Mexico", nameFa: "مکزیک", group: "A" },
  { code: "RSA", nameEn: "South Africa", nameFa: "آفریقای جنوبی", group: "A" },
  { code: "KOR", nameEn: "South Korea", nameFa: "کره جنوبی", group: "A" },
  { code: "CZE", nameEn: "Czechia", nameFa: "جمهوری چک", group: "A" },
  { code: "CAN", nameEn: "Canada", nameFa: "کانادا", group: "B" },
  { code: "BIH", nameEn: "Bosnia and Herzegovina", nameFa: "بوسنی و هرزگوین", group: "B" },
  { code: "QAT", nameEn: "Qatar", nameFa: "قطر", group: "B" },
  { code: "SUI", nameEn: "Switzerland", nameFa: "سوئیس", group: "B" },
  { code: "BRA", nameEn: "Brazil", nameFa: "برزیل", group: "C" },
  { code: "MAR", nameEn: "Morocco", nameFa: "مراکش", group: "C" },
  { code: "HAI", nameEn: "Haiti", nameFa: "هاییتی", group: "C" },
  { code: "SCO", nameEn: "Scotland", nameFa: "اسکاتلند", group: "C" },
  { code: "USA", nameEn: "United States", nameFa: "آمریکا", group: "D" },
  { code: "PAR", nameEn: "Paraguay", nameFa: "پاراگوئه", group: "D" },
  { code: "AUS", nameEn: "Australia", nameFa: "استرالیا", group: "D" },
  { code: "TUR", nameEn: "Türkiye", nameFa: "ترکیه", group: "D" },
  { code: "GER", nameEn: "Germany", nameFa: "آلمان", group: "E" },
  { code: "CUW", nameEn: "Curaçao", nameFa: "کوراسائو", group: "E" },
  { code: "CIV", nameEn: "Côte d'Ivoire", nameFa: "ساحل عاج", group: "E" },
  { code: "ECU", nameEn: "Ecuador", nameFa: "اکوادور", group: "E" },
  { code: "NED", nameEn: "Netherlands", nameFa: "هلند", group: "F" },
  { code: "JPN", nameEn: "Japan", nameFa: "ژاپن", group: "F" },
  { code: "SWE", nameEn: "Sweden", nameFa: "سوئد", group: "F" },
  { code: "TUN", nameEn: "Tunisia", nameFa: "تونس", group: "F" },
  { code: "BEL", nameEn: "Belgium", nameFa: "بلژیک", group: "G" },
  { code: "EGY", nameEn: "Egypt", nameFa: "مصر", group: "G" },
  { code: "IRN", nameEn: "Iran", nameFa: "ایران", group: "G" },
  { code: "NZL", nameEn: "New Zealand", nameFa: "نیوزیلند", group: "G" },
  { code: "ESP", nameEn: "Spain", nameFa: "اسپانیا", group: "H" },
  { code: "CPV", nameEn: "Cabo Verde", nameFa: "کیپ ورد", group: "H" },
  { code: "KSA", nameEn: "Saudi Arabia", nameFa: "عربستان", group: "H" },
  { code: "URU", nameEn: "Uruguay", nameFa: "اروگوئه", group: "H" },
  { code: "FRA", nameEn: "France", nameFa: "فرانسه", group: "I" },
  { code: "SEN", nameEn: "Senegal", nameFa: "سنگال", group: "I" },
  { code: "IRQ", nameEn: "Iraq", nameFa: "عراق", group: "I" },
  { code: "NOR", nameEn: "Norway", nameFa: "نروژ", group: "I" },
  { code: "ARG", nameEn: "Argentina", nameFa: "آرژانتین", group: "J" },
  { code: "ALG", nameEn: "Algeria", nameFa: "الجزایر", group: "J" },
  { code: "AUT", nameEn: "Austria", nameFa: "اتریش", group: "J" },
  { code: "JOR", nameEn: "Jordan", nameFa: "اردن", group: "J" },
  { code: "POR", nameEn: "Portugal", nameFa: "پرتغال", group: "K" },
  { code: "COD", nameEn: "DR Congo", nameFa: "کنگو", group: "K" },
  { code: "UZB", nameEn: "Uzbekistan", nameFa: "ازبکستان", group: "K" },
  { code: "COL", nameEn: "Colombia", nameFa: "کلمبیا", group: "K" },
  { code: "ENG", nameEn: "England", nameFa: "انگلیس", group: "L" },
  { code: "CRO", nameEn: "Croatia", nameFa: "کرواسی", group: "L" },
  { code: "GHA", nameEn: "Ghana", nameFa: "غنا", group: "L" },
  { code: "PAN", nameEn: "Panama", nameFa: "پاناما", group: "L" },
];

export const WC2026_FIXTURES: WcFixture[] = [
  // Matchday 1 — June 11–17
  { group: "A", matchday: 1, homeCode: "MEX", awayCode: "RSA", startTime: wcKickoffUtc(11, 15) },
  { group: "A", matchday: 1, homeCode: "KOR", awayCode: "CZE", startTime: wcKickoffUtc(11, 21) },
  { group: "B", matchday: 1, homeCode: "CAN", awayCode: "BIH", startTime: wcKickoffUtc(12, 15) },
  { group: "D", matchday: 1, homeCode: "USA", awayCode: "PAR", startTime: wcKickoffUtc(12, 21) },
  { group: "B", matchday: 1, homeCode: "QAT", awayCode: "SUI", startTime: wcKickoffUtc(13, 15) },
  { group: "C", matchday: 1, homeCode: "HAI", awayCode: "SCO", startTime: wcKickoffUtc(13, 18) },
  { group: "D", matchday: 1, homeCode: "AUS", awayCode: "TUR", startTime: wcKickoffUtc(13, 18) },
  { group: "C", matchday: 1, homeCode: "BRA", awayCode: "MAR", startTime: wcKickoffUtc(13, 21) },
  { group: "E", matchday: 1, homeCode: "CIV", awayCode: "ECU", startTime: wcKickoffUtc(14, 15) },
  { group: "F", matchday: 1, homeCode: "NED", awayCode: "JPN", startTime: wcKickoffUtc(14, 15) },
  { group: "E", matchday: 1, homeCode: "GER", awayCode: "CUW", startTime: wcKickoffUtc(14, 18) },
  { group: "F", matchday: 1, homeCode: "SWE", awayCode: "TUN", startTime: wcKickoffUtc(14, 18) },
  { group: "H", matchday: 1, homeCode: "ESP", awayCode: "CPV", startTime: wcKickoffUtc(15, 15) },
  { group: "H", matchday: 1, homeCode: "KSA", awayCode: "URU", startTime: wcKickoffUtc(15, 18) },
  { group: "G", matchday: 1, homeCode: "IRN", awayCode: "NZL", startTime: wcKickoffUtc(15, 18) },
  { group: "G", matchday: 1, homeCode: "BEL", awayCode: "EGY", startTime: wcKickoffUtc(15, 21) },
  { group: "I", matchday: 1, homeCode: "FRA", awayCode: "SEN", startTime: wcKickoffUtc(16, 15) },
  { group: "I", matchday: 1, homeCode: "IRQ", awayCode: "NOR", startTime: wcKickoffUtc(16, 18) },
  { group: "J", matchday: 1, homeCode: "ARG", awayCode: "ALG", startTime: wcKickoffUtc(16, 21) },
  { group: "J", matchday: 1, homeCode: "AUT", awayCode: "JOR", startTime: wcKickoffUtc(16, 21) },
  { group: "L", matchday: 1, homeCode: "GHA", awayCode: "PAN", startTime: wcKickoffUtc(17, 15) },
  { group: "L", matchday: 1, homeCode: "ENG", awayCode: "CRO", startTime: wcKickoffUtc(17, 18) },
  { group: "K", matchday: 1, homeCode: "POR", awayCode: "COD", startTime: wcKickoffUtc(17, 18) },
  { group: "K", matchday: 1, homeCode: "UZB", awayCode: "COL", startTime: wcKickoffUtc(17, 21) },

  // Matchday 2 — June 18–23
  { group: "A", matchday: 2, homeCode: "CZE", awayCode: "RSA", startTime: wcKickoffUtc(18, 15) },
  { group: "B", matchday: 2, homeCode: "SUI", awayCode: "BIH", startTime: wcKickoffUtc(18, 15) },
  { group: "B", matchday: 2, homeCode: "CAN", awayCode: "QAT", startTime: wcKickoffUtc(18, 18) },
  { group: "A", matchday: 2, homeCode: "MEX", awayCode: "KOR", startTime: wcKickoffUtc(18, 21) },
  { group: "D", matchday: 2, homeCode: "USA", awayCode: "AUS", startTime: wcKickoffUtc(19, 15) },
  { group: "C", matchday: 2, homeCode: "MAR", awayCode: "SCO", startTime: wcKickoffUtc(19, 18) },
  { group: "C", matchday: 2, homeCode: "BRA", awayCode: "HAI", startTime: wcKickoffUtc(19, 18) },
  { group: "D", matchday: 2, homeCode: "PAR", awayCode: "TUR", startTime: wcKickoffUtc(19, 21) },
  { group: "F", matchday: 2, homeCode: "NED", awayCode: "SWE", startTime: wcKickoffUtc(20, 15) },
  { group: "E", matchday: 2, homeCode: "GER", awayCode: "CIV", startTime: wcKickoffUtc(20, 18) },
  { group: "E", matchday: 2, homeCode: "ECU", awayCode: "CUW", startTime: wcKickoffUtc(20, 21) },
  { group: "F", matchday: 2, homeCode: "TUN", awayCode: "JPN", startTime: wcKickoffUtc(21, 15) },
  { group: "H", matchday: 2, homeCode: "ESP", awayCode: "KSA", startTime: wcKickoffUtc(21, 18) },
  { group: "G", matchday: 2, homeCode: "BEL", awayCode: "IRN", startTime: wcKickoffUtc(21, 18) },
  { group: "H", matchday: 2, homeCode: "URU", awayCode: "CPV", startTime: wcKickoffUtc(21, 18) },
  { group: "G", matchday: 2, homeCode: "EGY", awayCode: "NZL", startTime: wcKickoffUtc(21, 21) },
  { group: "J", matchday: 2, homeCode: "ARG", awayCode: "AUT", startTime: wcKickoffUtc(22, 13) },
  { group: "I", matchday: 2, homeCode: "FRA", awayCode: "IRQ", startTime: wcKickoffUtc(22, 17) },
  { group: "I", matchday: 2, homeCode: "NOR", awayCode: "SEN", startTime: wcKickoffUtc(22, 20) },
  { group: "J", matchday: 2, homeCode: "JOR", awayCode: "ALG", startTime: wcKickoffUtc(22, 23) },
  { group: "K", matchday: 2, homeCode: "POR", awayCode: "UZB", startTime: wcKickoffUtc(23, 13) },
  { group: "L", matchday: 2, homeCode: "ENG", awayCode: "GHA", startTime: wcKickoffUtc(23, 16) },
  { group: "L", matchday: 2, homeCode: "PAN", awayCode: "CRO", startTime: wcKickoffUtc(23, 19) },
  { group: "K", matchday: 2, homeCode: "COL", awayCode: "COD", startTime: wcKickoffUtc(23, 22) },

  // Matchday 3 — June 24–27
  { group: "B", matchday: 3, homeCode: "SUI", awayCode: "CAN", startTime: wcKickoffUtc(24, 15) },
  { group: "B", matchday: 3, homeCode: "BIH", awayCode: "QAT", startTime: wcKickoffUtc(24, 15) },
  { group: "C", matchday: 3, homeCode: "SCO", awayCode: "BRA", startTime: wcKickoffUtc(24, 18) },
  { group: "C", matchday: 3, homeCode: "MAR", awayCode: "HAI", startTime: wcKickoffUtc(24, 18) },
  { group: "A", matchday: 3, homeCode: "CZE", awayCode: "MEX", startTime: wcKickoffUtc(24, 21) },
  { group: "A", matchday: 3, homeCode: "RSA", awayCode: "KOR", startTime: wcKickoffUtc(24, 21) },
  { group: "E", matchday: 3, homeCode: "ECU", awayCode: "GER", startTime: wcKickoffUtc(25, 16) },
  { group: "E", matchday: 3, homeCode: "CUW", awayCode: "CIV", startTime: wcKickoffUtc(25, 16) },
  { group: "F", matchday: 3, homeCode: "JPN", awayCode: "SWE", startTime: wcKickoffUtc(25, 19) },
  { group: "F", matchday: 3, homeCode: "TUN", awayCode: "NED", startTime: wcKickoffUtc(25, 19) },
  { group: "D", matchday: 3, homeCode: "TUR", awayCode: "USA", startTime: wcKickoffUtc(25, 22) },
  { group: "D", matchday: 3, homeCode: "PAR", awayCode: "AUS", startTime: wcKickoffUtc(25, 22) },
  { group: "I", matchday: 3, homeCode: "NOR", awayCode: "FRA", startTime: wcKickoffUtc(26, 15) },
  { group: "I", matchday: 3, homeCode: "SEN", awayCode: "IRQ", startTime: wcKickoffUtc(26, 15) },
  { group: "H", matchday: 3, homeCode: "CPV", awayCode: "KSA", startTime: wcKickoffUtc(26, 20) },
  { group: "H", matchday: 3, homeCode: "URU", awayCode: "ESP", startTime: wcKickoffUtc(26, 20) },
  { group: "G", matchday: 3, homeCode: "EGY", awayCode: "IRN", startTime: wcKickoffUtc(26, 23) },
  { group: "G", matchday: 3, homeCode: "NZL", awayCode: "BEL", startTime: wcKickoffUtc(26, 23) },
  { group: "J", matchday: 3, homeCode: "JOR", awayCode: "ARG", startTime: wcKickoffUtc(27, 15) },
  { group: "J", matchday: 3, homeCode: "ALG", awayCode: "AUT", startTime: wcKickoffUtc(27, 15) },
  { group: "K", matchday: 3, homeCode: "UZB", awayCode: "COD", startTime: wcKickoffUtc(27, 18) },
  { group: "K", matchday: 3, homeCode: "COL", awayCode: "POR", startTime: wcKickoffUtc(27, 18) },
  { group: "L", matchday: 3, homeCode: "CRO", awayCode: "GHA", startTime: wcKickoffUtc(27, 21) },
  { group: "L", matchday: 3, homeCode: "PAN", awayCode: "ENG", startTime: wcKickoffUtc(27, 21) },
];

export const WC2026_TEAM_CODES = new Set(WC2026_TEAMS.map((t) => t.code));
