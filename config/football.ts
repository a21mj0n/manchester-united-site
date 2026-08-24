/**
 * API-Football sozlamalari — barcha identifikatorlar bitta joyda.
 *
 * Team ID (33) API orqali tekshirilgan: GET /teams?id=33 →
 * "Manchester United", England, tashkil topgan yili 1878.
 * Tekshirish uchun lib/football/teams.ts dagi verifyTeamId() ham bor.
 */

/** Manchester United'ning API-Football'dagi identifikatori */
export const MANCHESTER_UNITED_TEAM_ID = 33;

/**
 * Musobaqa (liga) identifikatorlari — API-Football hujjatidagi qiymatlar.
 * Hardcode tarqalib ketmasligi uchun faqat shu yerda saqlanadi.
 */
export const COMPETITIONS = {
  premierLeague: 39,
  championsLeague: 2,
  europaLeague: 3,
  faCup: 45,
  eflCup: 48,
  communityShield: 528,
  uefaSuperCup: 531,
  clubWorldCup: 15,
} as const;

export const PREMIER_LEAGUE_ID = COMPETITIONS.premierLeague;

/**
 * Musobaqa nomlarining o'zbekcha ko'rinishi.
 *
 * Ikkala manba nomlari ham bor: API-Football ("Premier League") va
 * TheSportsDB ("English Premier League") — bazadagi eski yozuvlar
 * ham to'g'ri ko'rsatilsin.
 */
export const COMPETITION_LABELS: Record<string, string> = {
  "Premier League": "Premer-liga",
  "UEFA Champions League": "Chempionlar ligasi",
  "UEFA Europa League": "Yevropa ligasi",
  "FA Cup": "Angliya kubogi",
  "League Cup": "Liga kubogi (EFL)",
  "Community Shield": "Hamjamiyat qalqoni",
  "UEFA Super Cup": "UEFA Superkubogi",
  "FIFA Club World Cup": "Klublar jahon chempionati",
  "UEFA Nations League": "Millatlar ligasi",
  "Euro Championship": "Yevropa chempionati",
  "World Cup": "Jahon chempionati",
  "World Cup - Qualification Europe": "JCh saralashi (Yevropa)",
  "Euro Championship - Qualification": "Yevro saralashi",
  "Friendlies": "O'rtoqlik o'yini",
  "Club Friendlies": "O'rtoqlik o'yini",
  "Friendlies Clubs": "O'rtoqlik o'yini",

  // TheSportsDB ko'rinishlari
  "English Premier League": "Premer-liga",
  "English FA Cup": "Angliya kubogi",
  "English League Cup": "Liga kubogi (EFL)",
  "UEFA Europa Conference League": "Konferensiya ligasi",
};

export function competitionLabel(apiName: string): string {
  return COMPETITION_LABELS[apiName] ?? apiName;
}

/**
 * Joriy mavsum — API-Football formatida boshlanish yili bilan
 * belgilanadi: 2026/27 mavsumi uchun 2026.
 *
 * FOOTBALL_SEASON env o'zgaruvchisi orqali qo'lda ham belgilash
 * mumkin (masalan bepul tarif faqat eski mavsumlarni ochganda).
 */
export function currentApiSeason(now: Date = new Date()): number {
  const override = Number(process.env.FOOTBALL_SEASON);
  if (Number.isInteger(override) && override > 2000) return override;

  const year = now.getUTCFullYear();
  // Mavsum avgustda boshlanadi; iyuldan boshlab yangisini ko'rsatamiz
  return now.getUTCMonth() >= 6 ? year : year - 1;
}

/** Sahifadagi mavsum tanlovi uchun so'nggi mavsumlar ro'yxati */
export function selectableSeasons(count = 4): number[] {
  const current = currentApiSeason();
  return Array.from({ length: count }, (_, i) => current - i);
}

/**
 * Kesh muddatlari (soniyada) — API kunlik limitini tejash uchun.
 * Tugagan o'yinlar deyarli o'zgarmaydi, jonli ma'lumot tez-tez
 * yangilanadi.
 */
export const CACHE = {
  /** Mavsum o'yinlari ro'yxati */
  fixtures: 900,
  /** Tugagan o'yin tafsilotlari (events/lineups/statistics) */
  finishedMatch: 3600,
  /** Boshlanmagan yoki jonli o'yin tafsilotlari */
  liveMatch: 120,
  /** Turnir jadvali */
  standings: 900,
  /** Jamoa tarkibi — kuniga bir marta yetadi */
  squad: 86400,
  /** Futbolchi mavsum statistikasi */
  playerStats: 21600,
} as const;
