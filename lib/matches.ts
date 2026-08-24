/**
 * /matches sahifasi uchun ma'lumot qatlami.
 *
 * Asosiy manba — API-Football (mavsumning barcha o'yinlari, barcha
 * musobaqalar). U ishlamasa joriy mavsum uchun bazadagi (TheSportsDB
 * sinxronizatsiyasi) o'yinlar ko'rsatiladi — ularda tafsilot sahifasi
 * bo'lmaydi, chunki events/lineups/statistics faqat API-Football'da bor.
 */

import { competitionLabel, currentApiSeason } from "@/config/football";
import { fetchSeasonFixtures } from "./football/fixtures";
import { apiFixtureId } from "./match-id";
import { prisma } from "./prisma";
import type { MatchItem } from "@/types/football";

export type MatchSource = "api" | "db" | "none";

export interface SeasonMatches {
  matches: MatchItem[];
  season: number;
  source: MatchSource;
}

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];

function dbMatchToItem(m: {
  id: number;
  extId: string;
  kickoff: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: string;
  venue: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
}): MatchItem {
  const local = new Date(m.kickoff.getTime() + TASHKENT_OFFSET_MS);
  const finished = m.homeScore !== null;
  // API-Football'dan sinxronlangan bo'lsa tafsilot sahifasi ochiladi
  const fixtureId = apiFixtureId(m.extId);
  return {
    id: fixtureId ?? m.id,
    hasDetails: fixtureId !== null,
    utcDate: m.kickoff.toISOString(),
    date: `${local.getUTCDate()}-${MONTHS[local.getUTCMonth()]}`,
    time: `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`,
    phase: finished ? "finished" : "upcoming",
    statusLabel: finished ? "Tugadi" : "Boshlanmagan",
    elapsed: null,
    home: m.homeTeam,
    away: m.awayTeam,
    homeLogo: m.homeBadge,
    awayLogo: m.awayBadge,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    competition: competitionLabel(m.competition),
    competitionId: 0,
    round: "",
    venue: m.venue,
    season: currentApiSeason(),
  };
}

/** Mavsum o'yinlari: API-Football → baza (faqat joriy mavsum). */
export async function getSeasonMatches(
  season: number = currentApiSeason(),
): Promise<SeasonMatches> {
  const fromApi = await fetchSeasonFixtures(season);
  if (fromApi && fromApi.length > 0) {
    return { matches: fromApi, season, source: "api" };
  }

  // Baza faqat joriy ma'lumotni saqlaydi — eski mavsumga zaxira yo'q
  if (season === currentApiSeason()) {
    try {
      const rows = await prisma.match.findMany({ orderBy: { kickoff: "asc" } });
      if (rows.length > 0) {
        return { matches: rows.map(dbMatchToItem), season, source: "db" };
      }
    } catch (error) {
      console.error("[matches] baza o'qilmadi:", error);
    }
  }

  return { matches: [], season, source: "none" };
}
