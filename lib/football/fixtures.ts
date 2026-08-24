/**
 * O'yinlar — API-Football'dan olish va domain type'larga map qilish.
 *
 * Eslatma: bepul tarifda joriy mavsum, next/last parametrlari va live
 * yopiq bo'lishi mumkin — bunday holatda funksiyalar null qaytaradi va
 * chaqiruvchi tomon bazadagi (TheSportsDB sinxronizatsiyasi) yoki demo
 * ma'lumotga tushadi. Pullik kalit qo'yilsa hammasi avtomatik ishlaydi.
 */

import {
  CACHE,
  competitionLabel,
  currentApiSeason,
  MANCHESTER_UNITED_TEAM_ID,
} from "@/config/football";
import type {
  ApiEvent,
  ApiFixture,
  ApiLineup,
  ApiTeamStatistics,
  LineupTeam,
  MatchDetails,
  MatchEvent,
  MatchItem,
  MatchPhase,
  StatRow,
} from "@/types/football";
import { apiGet } from "./client";

/* =============== Sana va holat =============== */

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];

function tashkentParts(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: "—", time: "—" };
  const local = new Date(parsed.getTime() + TASHKENT_OFFSET_MS);
  return {
    date: `${local.getUTCDate()}-${MONTHS[local.getUTCMonth()]}`,
    time: `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`,
  };
}

const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

const STATUS_LABELS: Record<string, string> = {
  TBD: "Vaqti aniqlanmagan",
  NS: "Boshlanmagan",
  HT: "Tanaffus",
  FT: "Tugadi",
  AET: "Qo'shimcha vaqtda tugadi",
  PEN: "Penaltilar seriyasi",
  PST: "Qoldirilgan",
  CANC: "Bekor qilingan",
  ABD: "To'xtatilgan",
  SUSP: "Vaqtincha to'xtatilgan",
  INT: "Uzilish",
  AWD: "Texnik natija",
  WO: "Texnik natija",
};

export function phaseOf(shortStatus: string): MatchPhase {
  if (LIVE_CODES.has(shortStatus)) return "live";
  if (FINISHED_CODES.has(shortStatus)) return "finished";
  return "upcoming";
}

function statusLabel(short: string, elapsed: number | null): string {
  if (LIVE_CODES.has(short) && short !== "HT" && elapsed !== null) return `${elapsed}'`;
  return STATUS_LABELS[short] ?? short;
}

/* =============== Mapping =============== */

export function mapFixture(f: ApiFixture): MatchItem {
  const { date, time } = tashkentParts(f.fixture.date);
  const short = f.fixture.status.short;
  return {
    id: f.fixture.id,
    hasDetails: true,
    utcDate: f.fixture.date,
    date,
    time,
    phase: phaseOf(short),
    statusLabel: statusLabel(short, f.fixture.status.elapsed),
    elapsed: f.fixture.status.elapsed,
    home: f.teams.home.name,
    away: f.teams.away.name,
    homeLogo: f.teams.home.logo ?? null,
    awayLogo: f.teams.away.logo ?? null,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    competition: competitionLabel(f.league.name),
    competitionId: f.league.id,
    round: f.league.round,
    venue: f.fixture.venue.name,
    season: f.league.season,
  };
}

/* =============== So'rovlar =============== */

/** Mavsumning barcha o'yinlari (barcha musobaqalar bo'yicha). */
export async function fetchSeasonFixtures(
  season: number = currentApiSeason(),
): Promise<MatchItem[] | null> {
  const rows = await apiGet<ApiFixture>(
    "fixtures",
    { team: MANCHESTER_UNITED_TEAM_ID, season },
    CACHE.fixtures,
  );
  if (!rows || rows.length === 0) return null;

  return rows
    .map(mapFixture)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
}

/** Keyingi o'yin(lar). Bepul tarifda next parametri yopiq bo'lishi mumkin. */
export async function fetchNextFixtures(count = 1): Promise<MatchItem[] | null> {
  const rows = await apiGet<ApiFixture>(
    "fixtures",
    { team: MANCHESTER_UNITED_TEAM_ID, next: count },
    CACHE.fixtures,
  );
  if (!rows || rows.length === 0) return null;
  return rows.map(mapFixture);
}

/** Oxirgi o'ynalgan o'yin(lar). */
export async function fetchLastFixtures(count = 1): Promise<MatchItem[] | null> {
  const rows = await apiGet<ApiFixture>(
    "fixtures",
    { team: MANCHESTER_UNITED_TEAM_ID, last: count },
    CACHE.fixtures,
  );
  if (!rows || rows.length === 0) return null;
  return rows.map(mapFixture);
}

/**
 * Hozir jonli borayotgan Manchester United o'yini.
 * API live=all bilan team filtrini qo'llab-quvvatlamaydi —
 * javobdan o'zimiz ajratib olamiz.
 */
export async function fetchLiveUnitedMatch(): Promise<MatchItem | null> {
  const rows = await apiGet<ApiFixture>("fixtures", { live: "all" }, CACHE.liveMatch);
  if (!rows) return null;

  const match = rows.find(
    (f) =>
      f.teams.home.id === MANCHESTER_UNITED_TEAM_ID ||
      f.teams.away.id === MANCHESTER_UNITED_TEAM_ID,
  );
  return match ? mapFixture(match) : null;
}

/* =============== O'yin tafsilotlari =============== */

const EVENT_KINDS: Record<string, { kind: string; label: string }> = {
  "Normal Goal": { kind: "goal", label: "Gol" },
  "Own Goal": { kind: "own-goal", label: "Avtogol" },
  "Penalty": { kind: "penalty", label: "Gol (penalti)" },
  "Missed Penalty": { kind: "missed-penalty", label: "Penalti kirmadi" },
  "Yellow Card": { kind: "yellow", label: "Sariq kartochka" },
  "Second Yellow card": { kind: "red", label: "Ikkinchi sariq (qizil)" },
  "Red Card": { kind: "red", label: "Qizil kartochka" },
};

function mapEvent(e: ApiEvent): MatchEvent {
  let kind = "other";
  let label = e.detail;

  if (e.type === "Goal" || e.type === "Card") {
    const known = EVENT_KINDS[e.detail];
    if (known) ({ kind, label } = known);
    else kind = e.type === "Goal" ? "goal" : "yellow";
  } else if (e.type === "subst") {
    kind = "sub";
    label = "Almashtirish";
  } else if (e.type === "Var") {
    kind = "var";
    label = `VAR: ${e.detail}`;
  }

  return {
    minute: e.time.elapsed,
    extra: e.time.extra,
    team: e.team.name,
    isUnited: e.team.id === MANCHESTER_UNITED_TEAM_ID,
    player: e.player.name ?? "—",
    assist: e.assist.name,
    kind,
    label,
    detail: e.comments,
  };
}

function mapLineup(l: ApiLineup): LineupTeam {
  const mapPlayer = (p: ApiLineup["startXI"][number]) => ({
    id: p.player.id,
    name: p.player.name,
    number: p.player.number,
    pos: p.player.pos,
    grid: p.player.grid,
  });
  return {
    team: l.team.name,
    logo: l.team.logo ?? null,
    coach: l.coach.name,
    formation: l.formation,
    startXI: (l.startXI ?? []).map(mapPlayer),
    substitutes: (l.substitutes ?? []).map(mapPlayer),
  };
}

/** Statistika turlarining o'zbekcha nomlari */
const STAT_LABELS: Record<string, string> = {
  "Ball Possession": "To'p nazorati",
  "Total Shots": "Jami zarbalar",
  "Shots on Goal": "Aniq zarbalar",
  "Shots off Goal": "Noaniq zarbalar",
  "Blocked Shots": "To'silgan zarbalar",
  "Shots insidebox": "Jarima maydonidan zarbalar",
  "Shots outsidebox": "Maydon tashqarisidan zarbalar",
  "Corner Kicks": "Burchak zarbalari",
  "Offsides": "Ofsaydlar",
  "Fouls": "Qoida buzishlar",
  "Yellow Cards": "Sariq kartochkalar",
  "Red Cards": "Qizil kartochkalar",
  "Goalkeeper Saves": "Darvozabon seyvlari",
  "Total passes": "Jami uzatmalar",
  "Passes accurate": "Aniq uzatmalar",
  "Passes %": "Uzatmalar aniqligi",
  "expected_goals": "Kutilgan gollar (xG)",
};

/** Jadvalda ko'rsatiladigan tartib — API tartibi aralash keladi */
const STAT_ORDER = Object.keys(STAT_LABELS);

function mapStats(rows: ApiTeamStatistics[]): StatRow[] {
  if (rows.length < 2) return [];
  // API statistikani fixture'dagi home/away tartibida beradi
  const [homeRaw, awayRaw] = rows;

  const homeMap = new Map(homeRaw.statistics.map((s) => [s.type, s.value]));
  const awayMap = new Map(awayRaw.statistics.map((s) => [s.type, s.value]));

  // Manba bermagan ko'rsatkichni ko'rsatmaymiz: null ni "0" deb
  // chizish noto'g'ri ma'lumot bo'ladi (masalan xG o'rtoqlik o'yinida)
  const types = STAT_ORDER.filter((t) => {
    const h = homeMap.get(t);
    const a = awayMap.get(t);
    return (h !== undefined && h !== null) || (a !== undefined && a !== null);
  });

  return types.map((type) => {
    const h = homeMap.get(type) ?? 0;
    const a = awayMap.get(type) ?? 0;
    const hn = typeof h === "string" ? parseFloat(h) : (h ?? 0);
    const an = typeof a === "string" ? parseFloat(a) : (a ?? 0);
    const total = (hn || 0) + (an || 0);
    return {
      label: STAT_LABELS[type] ?? type,
      home: h === null ? "0" : String(h),
      away: a === null ? "0" : String(a),
      homeShare: total > 0 ? Math.round(((hn || 0) / total) * 100) : 50,
    };
  });
}

function scoreString(s: { home: number | null; away: number | null }): string | null {
  if (s.home === null && s.away === null) return null;
  return `${s.home ?? 0} : ${s.away ?? 0}`;
}

/**
 * Bitta o'yinning to'liq tafsilotlari: umumiy ma'lumot, hisob,
 * voqealar, tarkiblar va statistika. O'yin topilmasa null.
 */
export async function fetchMatchDetails(fixtureId: number): Promise<MatchDetails | null> {
  const fixtures = await apiGet<ApiFixture>("fixtures", { id: fixtureId }, CACHE.liveMatch);
  const fixture = fixtures?.[0];
  if (!fixture) return null;

  // Tugagan o'yin uzoq keshlanadi, jonli/kelgusi — qisqa
  const finished = phaseOf(fixture.fixture.status.short) === "finished";
  const revalidate = finished ? CACHE.finishedMatch : CACHE.liveMatch;

  const [events, lineups, stats] = await Promise.all([
    apiGet<ApiEvent>("fixtures/events", { fixture: fixtureId }, revalidate),
    apiGet<ApiLineup>("fixtures/lineups", { fixture: fixtureId }, revalidate),
    apiGet<ApiTeamStatistics>("fixtures/statistics", { fixture: fixtureId }, revalidate),
  ]);

  return {
    match: mapFixture(fixture),
    referee: fixture.fixture.referee,
    venueCity: fixture.fixture.venue.city,
    score: {
      halftime: scoreString(fixture.score.halftime),
      fulltime: scoreString(fixture.score.fulltime),
      extratime: scoreString(fixture.score.extratime),
      penalty: scoreString(fixture.score.penalty),
    },
    events: (events ?? []).map(mapEvent),
    lineups: (lineups ?? []).map(mapLineup),
    stats: mapStats(stats ?? []),
  };
}
