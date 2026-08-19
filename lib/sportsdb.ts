/**
 * TheSportsDB — o'yinlar va turnir jadvali uchun tashqi API.
 *
 * Kalit shart emas: bepul "3" test kaliti ishlaydi. Ko'proq so'rov
 * kerak bo'lsa SPORTSDB_KEY orqali o'z kalitingizni bering.
 *
 * Har bir funksiya xatolikda null qaytaradi — chaqiruvchi tomon
 * demo ma'lumotga tushadi, ya'ni API yotib qolsa ham sayt ishlaydi.
 */

import type { Fixture, Result, Standing } from "./types";

const BASE = "https://www.thesportsdb.com/api/v1/json";
const PREMIER_LEAGUE = "4328";
const MANCHESTER_UNITED = "133612";
const MU_NAME = "Manchester United";

/** Ma'lumot bir soat keshlanadi — API ni ortiqcha bezovta qilmaymiz. */
const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 8000;

function apiKey(): string {
  return process.env.SPORTSDB_KEY || "3";
}

/** Futbol mavsumi avgustda boshlanadi: 2026-yil avgust → "2026-2027". */
export function currentSeason(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const startYear = now.getUTCMonth() >= 6 ? year : year - 1; // iyul va keyin
  return `${startYear}-${startYear + 1}`;
}

export function previousSeason(season: string): string {
  const start = Number(season.split("-")[0]) - 1;
  return `${start}-${start + 1}`;
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${BASE}/${apiKey()}/${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("[sportsdb] javob:", response.status, path);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("[sportsdb] xatolik:", path, error);
    return null;
  }
}

/* ---------------- Turnir jadvali ---------------- */

interface RawStanding {
  intRank: string;
  strTeam: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intGoalDifference: string;
  intPoints: string;
}

function mapStandings(rows: RawStanding[]): Standing[] {
  return rows.map((r) => {
    const gd = Number(r.intGoalDifference);
    return {
      pos: Number(r.intRank),
      team: r.strTeam,
      played: Number(r.intPlayed),
      won: Number(r.intWin),
      drawn: Number(r.intDraw),
      lost: Number(r.intLoss),
      gd: gd > 0 ? `+${gd}` : String(gd),
      points: Number(r.intPoints),
      isUnited: r.strTeam === MU_NAME,
    };
  });
}

export interface StandingsResult {
  rows: Standing[];
  season: string;
  /** Joriy mavsumda hali ma'lumot bo'lmagani uchun oldingisi ko'rsatilyaptimi */
  isPreviousSeason: boolean;
}

/**
 * Joriy mavsum jadvali. Mavsum endi boshlangan bo'lib, jadval hali
 * to'lmagan bo'lsa (jamoalar kam yoki hech kim o'ynamagan) —
 * oldingi mavsumning yakuniy jadvali qaytariladi.
 */
export async function fetchStandings(): Promise<StandingsResult | null> {
  const season = currentSeason();
  const data = await get<{ table?: RawStanding[] }>(
    `lookuptable.php?l=${PREMIER_LEAGUE}&s=${season}`,
  );

  const rows = data?.table ?? [];
  const hasRealData = rows.length >= 15 && rows.some((r) => Number(r.intPlayed) > 0);

  if (hasRealData) {
    return { rows: mapStandings(rows), season, isPreviousSeason: false };
  }

  const earlier = previousSeason(season);
  const fallback = await get<{ table?: RawStanding[] }>(
    `lookuptable.php?l=${PREMIER_LEAGUE}&s=${earlier}`,
  );

  if (!fallback?.table?.length) return null;

  return {
    rows: mapStandings(fallback.table),
    season: earlier,
    isPreviousSeason: true,
  };
}

/* ---------------- O'yinlar ---------------- */

interface RawEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strLeague: string;
  strVenue?: string | null;
  strTimestamp?: string | null;
  dateEvent?: string | null;
}

const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** UTC vaqtni Toshkent vaqtidagi "22-avgust" va "16:30" ko'rinishiga aylantiradi. */
function toTashkentParts(timestamp: string | null | undefined, fallbackDate?: string | null) {
  const raw = timestamp ?? (fallbackDate ? `${fallbackDate}T00:00:00` : null);
  if (!raw) return { date: "—", time: "—" };

  const parsed = new Date(raw.endsWith("Z") ? raw : `${raw}Z`);
  if (Number.isNaN(parsed.getTime())) return { date: "—", time: "—" };

  const local = new Date(parsed.getTime() + TASHKENT_OFFSET_MS);
  const time = timestamp
    ? `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`
    : "—";

  return { date: `${local.getUTCDate()}-${MONTHS[local.getUTCMonth()]}`, time };
}

/** Kelgusi o'yinlar. */
export async function fetchFixtures(): Promise<Fixture[] | null> {
  const data = await get<{ events?: RawEvent[] }>(`eventsnext.php?id=${MANCHESTER_UNITED}`);
  if (!data?.events?.length) return null;

  return data.events.map((e, index) => {
    const { date, time } = toTashkentParts(e.strTimestamp, e.dateEvent);
    return {
      id: Number(e.idEvent) || index,
      date,
      time,
      home: e.strHomeTeam,
      away: e.strAwayTeam,
      comp: e.strLeague,
      venue: e.strVenue?.trim() || (e.strHomeTeam === MU_NAME ? "Old Trafford" : "Mehmonda"),
    };
  });
}

/** O'tgan o'yinlar natijasi. */
export async function fetchResults(): Promise<Result[] | null> {
  const data = await get<{ results?: RawEvent[]; events?: RawEvent[] }>(
    `eventslast.php?id=${MANCHESTER_UNITED}`,
  );

  const events = data?.results ?? data?.events ?? [];
  const played = events.filter((e) => e.intHomeScore !== null && e.intAwayScore !== null);
  if (!played.length) return null;

  return played.map((e, index) => {
    const { date } = toTashkentParts(e.strTimestamp, e.dateEvent);
    return {
      id: Number(e.idEvent) || index,
      date,
      home: e.strHomeTeam,
      away: e.strAwayTeam,
      homeScore: Number(e.intHomeScore),
      awayScore: Number(e.intAwayScore),
      comp: e.strLeague,
    };
  });
}
