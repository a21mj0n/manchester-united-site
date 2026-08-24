/**
 * API-Football (v3) javob type'lari va ulardan hosil qilinadigan
 * domain type'lar.
 *
 * Raw type'lar (Api* prefiksi) faqat lib/football/ ichida ishlatiladi —
 * UI komponentlariga faqat domain type'lar uzatiladi, shunda API
 * o'zgarsa faqat mapping qatlami tuzatiladi.
 */

/* =============== Raw API type'lar =============== */

export interface ApiTeamRef {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface ApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    date: string; // ISO 8601
    timestamp: number;
    venue: { id: number | null; name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  teams: { home: ApiTeamRef; away: ApiTeamRef };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: ApiTeamRef;
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string; // Goal | Card | subst | Var
  detail: string;
  comments: string | null;
}

export interface ApiLineupPlayer {
  player: {
    id: number;
    name: string;
    number: number;
    pos: string | null;
    grid: string | null;
  };
}

export interface ApiLineup {
  team: ApiTeamRef & { colors?: unknown };
  coach: { id: number | null; name: string | null; photo: string | null };
  formation: string | null;
  startXI: ApiLineupPlayer[];
  substitutes: ApiLineupPlayer[];
}

export interface ApiTeamStatistics {
  team: ApiTeamRef;
  statistics: { type: string; value: number | string | null }[];
}

export interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

export interface ApiPlayerProfile {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    birth: { date: string | null; place: string | null; country: string | null };
    nationality: string | null;
    height: string | null;
    weight: string | null;
    photo: string | null;
  };
  statistics: ApiPlayerCompetitionStats[];
}

export interface ApiPlayerCompetitionStats {
  team: ApiTeamRef;
  league: { id: number | null; name: string | null; logo: string | null; season: number | null };
  games: {
    appearences: number | null;
    lineups: number | null;
    minutes: number | null;
    number: number | null;
    position: string | null;
    rating: string | null;
    captain: boolean;
  };
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  duels: { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null };
  fouls: { drawn: number | null; committed: number | null };
  cards: { yellow: number | null; yellowred: number | null; red: number | null };
  penalty: { scored: number | null; missed: number | null; saved: number | null };
}

/* =============== Domain type'lar =============== */

/** O'yin holati — filtrlash uchun soddalashtirilgan guruh */
export type MatchPhase = "upcoming" | "live" | "finished";

export interface MatchItem {
  /** API-Football fixture id — tafsilot sahifasiga havola uchun */
  id: number;
  /** Tafsilot sahifasi mavjudmi (faqat API-Football manbasida) */
  hasDetails: boolean;
  utcDate: string;
  /** "24-avgust" (Toshkent vaqti) */
  date: string;
  /** "21:30" (Toshkent vaqti) */
  time: string;
  phase: MatchPhase;
  /** "Tugadi", "45'", "Boshlanmagan"… */
  statusLabel: string;
  elapsed: number | null;
  home: string;
  away: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  competition: string;
  competitionId: number;
  round: string;
  venue: string | null;
  season: number;
}

export interface MatchEvent {
  minute: number;
  extra: number | null;
  team: string;
  isUnited: boolean;
  player: string;
  assist: string | null;
  /** goal | own-goal | penalty | missed-penalty | yellow | red | sub | var */
  kind: string;
  label: string;
  detail: string | null;
}

export interface LineupPlayerItem {
  id: number;
  name: string;
  number: number;
  pos: string | null;
  /**
   * Maydondagi o'rni: "qator:ustun".
   * 1-qator — darvozabon, qator oshgani sari oldinga;
   * 1-ustun — chap qanot, ustun oshgani sari o'ngga.
   * Ayrim o'yinlarda manba bermaydi — null bo'ladi.
   */
  grid: string | null;
}

export interface LineupTeam {
  team: string;
  logo: string | null;
  coach: string | null;
  formation: string | null;
  startXI: LineupPlayerItem[];
  substitutes: LineupPlayerItem[];
}

export interface StatRow {
  label: string;
  home: string;
  away: string;
  /** Solishtirma chiziqcha uchun 0..100 ulush (home) */
  homeShare: number;
}

export interface MatchDetails {
  match: MatchItem;
  referee: string | null;
  venueCity: string | null;
  score: {
    halftime: string | null;
    fulltime: string | null;
    extratime: string | null;
    penalty: string | null;
  };
  events: MatchEvent[];
  lineups: LineupTeam[];
  stats: StatRow[];
}

export interface PlayerCompetitionStats {
  competition: string;
  competitionLogo: string | null;
  appearances: number;
  lineups: number;
  minutes: number;
  rating: string | null;
  goals: number;
  assists: number;
  shots: number;
  shotsOn: number;
  passes: number;
  keyPasses: number;
  passAccuracy: number | null;
  tackles: number;
  interceptions: number;
  dribblesWon: number;
  duelsWon: number;
  foulsDrawn: number;
  foulsCommitted: number;
  yellow: number;
  red: number;
  /** Darvozabon uchun */
  saves: number;
  conceded: number;
}

export interface PlayerProfile {
  id: number;
  name: string;
  photo: string | null;
  age: number | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  position: string | null;
  number: number | null;
  season: number;
  competitions: PlayerCompetitionStats[];
}
