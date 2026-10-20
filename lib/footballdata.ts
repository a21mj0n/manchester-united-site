/**
 * football-data.org — bepul tarifli asosiy manba.
 *
 * API-Football obunasi yo'q paytda o'yinlar, natijalar, to'liq turnir
 * jadvali va tarkib shu yerdan olinadi. Bepul tarif Premer-liga va
 * Chempionlar ligasini beradi; Angliya kubogi va Liga kubogi o'yinlari
 * bu tarifda yo'q. O'yin tafsilotlari (voqealar, tarkiblar) va futbolchi
 * statistikasi ham yo'q — ular API-Football qaytganda ochiladi.
 *
 * Kalit (FOOTBALL_DATA_KEY) faqat serverda o'qiladi. Kalit bo'lmasa har
 * bir funksiya darhol null qaytaradi — chaqiruvchi keyingi manbaga tushadi.
 *
 * Limit: daqiqasiga 10 so'rov. Kunlik sinxronizatsiya 3 ta so'rov qiladi,
 * sahifalar esa javobni 15 daqiqa keshlaydi.
 */

import { normalizeTeam } from "./badges";
import type { Fixture, Player, Position, Result, Standing } from "./types";
import type { StandingsResult } from "./sportsdb";

const BASE = process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4";
/** Manchester United'ning football-data.org dagi identifikatori */
const MANCHESTER_UNITED = 66;
const PREMIER_LEAGUE = "PL";
const TIMEOUT_MS = 10000;
/** Sahifalar uchun kesh muddati (soniya) — sinxronizatsiya 0 beradi */
const REVALIDATE_SECONDS = 900;

export function hasFootballDataKey(): boolean {
  return Boolean(process.env.FOOTBALL_DATA_KEY);
}

async function get<T>(path: string, revalidate = REVALIDATE_SECONDS): Promise<T | null> {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return null;

  try {
    const response = await fetch(`${BASE}/${path}`, {
      headers: { "X-Auth-Token": key },
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const hint = response.status === 429 ? " (daqiqalik limit)" : "";
      console.error(`[football-data] ${path}: HTTP ${response.status}${hint}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`[football-data] ${path}:`, error);
    return null;
  }
}

/* ---------------- Jamoa nomi ---------------- */

/** "Manchester United FC" → "Manchester United"; "AFC Bournemouth" o'zgarmaydi. */
export function cleanTeamName(name: string): string {
  return name.replace(/\s+(FC|AFC|CF|SC)$/i, "").trim();
}

function isUnited(name: string): boolean {
  return normalizeTeam(name) === "manchester united";
}

/** Mavsum boshlanish yili: 2026 → "2026-2027" */
function seasonLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}

/* ---------------- O'yinlar ---------------- */

interface RawTeam {
  id: number;
  name: string;
  shortName?: string | null;
  crest?: string | null;
}

interface RawMatch {
  id: number;
  utcDate: string;
  status: string;
  competition: { id: number; name: string; code?: string; emblem?: string | null };
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
}

/** Bazadagi Match yozuviga mos shakl — sinxronizatsiya va sahifalar uchun. */
export interface FdMatch {
  id: number;
  kickoff: Date;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: string;
  homeCrest: string | null;
  awayCrest: string | null;
}

/** Bu holatdagi o'yinlar jadvalda ko'rsatilmaydi — sanasi noaniq */
const SKIPPED_STATUSES = new Set(["POSTPONED", "CANCELLED", "SUSPENDED"]);
const FINISHED_STATUSES = new Set(["FINISHED", "AWARDED"]);

/**
 * Mavsumning barcha o'yinlari (tarifda ochiq musobaqalar bo'yicha).
 * Hisob faqat tugagan o'yinda yoziladi — jonli o'yin "tugadi" bo'lib
 * ko'rinmasin.
 */
export async function fetchTeamMatches(
  season: number,
  revalidate = REVALIDATE_SECONDS,
): Promise<FdMatch[] | null> {
  const data = await get<{ matches?: RawMatch[] }>(
    `teams/${MANCHESTER_UNITED}/matches?season=${season}`,
    revalidate,
  );
  if (!data?.matches) return null;

  const matches: FdMatch[] = [];
  for (const m of data.matches) {
    if (SKIPPED_STATUSES.has(m.status)) continue;
    const kickoff = new Date(m.utcDate);
    if (Number.isNaN(kickoff.getTime())) continue;

    const finished = FINISHED_STATUSES.has(m.status);
    matches.push({
      id: m.id,
      kickoff,
      home: cleanTeamName(m.homeTeam.name),
      away: cleanTeamName(m.awayTeam.name),
      homeScore: finished ? m.score.fullTime.home : null,
      awayScore: finished ? m.score.fullTime.away : null,
      competition: m.competition.name,
      homeCrest: m.homeTeam.crest ?? null,
      awayCrest: m.awayTeam.crest ?? null,
    });
  }

  matches.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  return matches;
}

const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function tashkentParts(d: Date) {
  const local = new Date(d.getTime() + TASHKENT_OFFSET_MS);
  return {
    date: `${local.getUTCDate()}-${MONTHS[local.getUTCMonth()]}`,
    time: `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`,
  };
}

/** Bosh sahifa uchun eng yaqin 5 ta o'yin. */
export async function fetchFixtures(season: number): Promise<Fixture[] | null> {
  const matches = await fetchTeamMatches(season);
  if (!matches) return null;

  const cutoff = Date.now() - 3 * 3600 * 1000;
  const upcoming = matches
    .filter((m) => m.homeScore === null && m.kickoff.getTime() >= cutoff)
    .slice(0, 5);
  if (upcoming.length === 0) return null;

  return upcoming.map((m) => {
    const { date, time } = tashkentParts(m.kickoff);
    return {
      id: m.id,
      date,
      time,
      home: m.home,
      away: m.away,
      comp: m.competition,
      venue: isUnited(m.home) ? "Old Trafford" : "Mehmonda",
      homeBadge: m.homeCrest,
      awayBadge: m.awayCrest,
    };
  });
}

/** Bosh sahifa uchun oxirgi 5 ta natija. */
export async function fetchResults(season: number): Promise<Result[] | null> {
  const matches = await fetchTeamMatches(season);
  if (!matches) return null;

  const played = matches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .reverse()
    .slice(0, 5);
  if (played.length === 0) return null;

  return played.map((m) => ({
    id: m.id,
    date: tashkentParts(m.kickoff).date,
    home: m.home,
    away: m.away,
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    comp: m.competition,
    homeBadge: m.homeCrest,
    awayBadge: m.awayCrest,
  }));
}

/* ---------------- Turnir jadvali ---------------- */

interface RawTableRow {
  position: number;
  team: RawTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalDifference: number;
  points: number;
}

interface RawStandings {
  season?: { startDate?: string };
  standings?: { type: string; table: RawTableRow[] }[];
}

function mapTable(rows: RawTableRow[]): Standing[] {
  return rows.map((r) => {
    const name = cleanTeamName(r.team.name);
    return {
      pos: r.position,
      team: name,
      played: r.playedGames,
      won: r.won,
      drawn: r.draw,
      lost: r.lost,
      gd: r.goalDifference > 0 ? `+${r.goalDifference}` : String(r.goalDifference),
      points: r.points,
      isUnited: isUnited(name),
      badge: r.team.crest ?? null,
    };
  });
}

async function fetchTable(season: number | null, revalidate: number) {
  const query = season ? `?season=${season}` : "";
  const data = await get<RawStandings>(
    `competitions/${PREMIER_LEAGUE}/standings${query}`,
    revalidate,
  );
  const table = data?.standings?.find((s) => s.type === "TOTAL")?.table;
  if (!table?.length) return null;

  const startYear = Number(data?.season?.startDate?.slice(0, 4));
  return { rows: mapTable(table), startYear: Number.isInteger(startYear) ? startYear : null };
}

/**
 * To'liq 20 talik Premer-liga jadvali. Mavsum endi boshlanib hali hech
 * kim o'ynamagan bo'lsa, oldingi mavsumning yakuniy jadvali qaytariladi
 * va shunday deb belgilanadi.
 */
export async function fetchStandings(
  revalidate = REVALIDATE_SECONDS,
): Promise<StandingsResult | null> {
  const current = await fetchTable(null, revalidate);
  if (!current) return null;

  const started = current.rows.some((r) => r.played > 0);
  if (started || current.startYear === null) {
    return {
      rows: current.rows,
      season: current.startYear !== null ? seasonLabel(current.startYear) : "joriy",
      isPreviousSeason: false,
    };
  }

  const previous = await fetchTable(current.startYear - 1, revalidate);
  if (!previous) {
    return { rows: current.rows, season: seasonLabel(current.startYear), isPreviousSeason: false };
  }

  return {
    rows: previous.rows,
    season: seasonLabel(current.startYear - 1),
    isPreviousSeason: true,
  };
}

/* ---------------- Tarkib ---------------- */

interface RawSquadPlayer {
  id: number;
  name: string;
  position?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  shirtNumber?: number | null;
}

const POSITION_LABEL: Record<Position, string> = {
  GK: "Darvozabon",
  DF: "Himoyachi",
  MF: "Yarim himoyachi",
  FW: "Hujumchi",
};

/**
 * Manba pozitsiyani batafsil beradi ("Centre-Back", "Right Winger",
 * ba'zan umumiy "Defence") — to'rt guruhga keltiramiz.
 */
function mapPosition(raw: string | null | undefined): Position | null {
  const p = (raw ?? "").toLowerCase();
  if (!p) return null;
  // "Defensive Midfield" va "Attacking Midfield" — avval yarim himoya tekshiriladi
  if (p.includes("midfield")) return "MF";
  if (p.includes("keeper")) return "GK";
  if (p.includes("back") || p.includes("defen")) return "DF";
  if (p.includes("wing") || p.includes("forward") || p.includes("offence") || p.includes("attack") || p.includes("striker")) {
    return "FW";
  }
  return null;
}

function ageFrom(dateOfBirth: string | null | undefined, now = new Date()): number | undefined {
  if (!dateOfBirth) return undefined;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return undefined;
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

/**
 * Joriy tarkib. `id` — football-data.org identifikatori (apiId emas,
 * shuning uchun statistika sahifasiga havola bo'lmaydi). Rasm yo'q.
 */
export async function fetchSquad(revalidate = REVALIDATE_SECONDS): Promise<Player[] | null> {
  const data = await get<{ squad?: RawSquadPlayer[] }>(`teams/${MANCHESTER_UNITED}`, revalidate);
  const raw = data?.squad ?? [];
  if (raw.length === 0) return null;

  const players: Player[] = [];
  for (const p of raw) {
    const pos = mapPosition(p.position);
    if (!pos) continue;
    players.push({
      id: p.id,
      num: p.shirtNumber ?? 0,
      name: p.name,
      pos,
      posName: POSITION_LABEL[pos],
      age: ageFrom(p.dateOfBirth),
      country: p.nationality ?? undefined,
    });
  }
  if (players.length === 0) return null;

  const ORDER: Position[] = ["GK", "DF", "MF", "FW"];
  players.sort((a, b) => {
    const byPos = ORDER.indexOf(a.pos) - ORDER.indexOf(b.pos);
    if (byPos !== 0) return byPos;
    if (a.num === 0) return 1;
    if (b.num === 0) return -1;
    return a.num - b.num;
  });

  return players;
}
