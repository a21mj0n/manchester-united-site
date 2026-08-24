import { competitionLabel } from "@/config/football";
import { FIXTURES, LEGENDS, RESULTS, SQUAD, STANDINGS, TIMELINE } from "./data";
import {
  readFixtures,
  readLastMatch,
  readNextKickoff,
  readResults,
  readSquad,
  readStandings,
} from "./db-read";
import { fetchLastFixtures, fetchNextFixtures } from "./football/fixtures";
import { fetchSquad } from "./football/players";
import { fetchLeagueStandings } from "./football/standings";
import { fetchFixtures, fetchResults, fetchStandings, type StandingsResult } from "./sportsdb";
import type { Fixture, Legend, Player, Result, Standing, TimelineItem } from "./types";

/**
 * Ma'lumot qatlami (data layer).
 *
 * To'rt bosqichli manba:
 *   1. Baza — kunlik sinxronizatsiya to'ldiradi (lib/sync/run.ts)
 *   2. API-Football — kalit o'rnatilgan va tarif ochiq bo'lsa
 *   3. TheSportsDB — bepul zaxira manba
 *   4. Demo ma'lumot — hech biri ishlamasa
 * (turnir jadvalida API-Football birinchi o'rinda — izohga qarang)
 * Shu sababli sayt hech qachon bo'sh bo'lim ko'rsatmaydi.
 * Tarix va afsonalar o'zgarmaydi — ular demo massivlarda qoladi.
 *
 * Barchasi `async` — manba almashsa faqat shu fayl o'zgaradi,
 * chaqiruvchi server komponentlari o'sha-o'shaligicha qoladi.
 */

export async function getSquad(): Promise<Player[]> {
  return (await readSquad()) ?? (await fetchSquad()) ?? SQUAD;
}

export async function getFixtures(): Promise<Fixture[]> {
  return (await readFixtures()) ?? (await fetchFixtures()) ?? FIXTURES;
}

export async function getResults(): Promise<Result[]> {
  return (await readResults()) ?? (await fetchResults()) ?? RESULTS;
}

/**
 * Turnir jadvali. Bu yerda tartib boshqacha — avval API-Football:
 * u to'liq 20 talik jadvalni beradi, bazadagi zaxira manba (TheSportsDB
 * bepul tarifi) esa faqat yuqori bir necha o'rinni biladi.
 * Kalit yo'q bo'lsa so'rov umuman ketmaydi va darhol bazaga tushamiz.
 */
export async function getStandings(): Promise<StandingsResult> {
  return (
    (await fetchLeagueStandings()) ??
    (await readStandings()) ??
    (await fetchStandings()) ?? {
      rows: STANDINGS,
      season: "namunaviy",
      isPreviousSeason: false,
    }
  );
}

export interface NextMatchInfo {
  kickoff: Date;
  home: string;
  away: string;
  competition: string;
  venue: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
}

/** Bosh sahifadagi sanoq uchun eng yaqin o'yin: baza → API-Football. */
export async function getNextMatch(): Promise<NextMatchInfo | null> {
  const fromDb = await readNextKickoff();
  if (fromDb) {
    return { ...fromDb, competition: competitionLabel(fromDb.competition) };
  }

  const fromApi = await fetchNextFixtures(1);
  const match = fromApi?.[0];
  if (!match) return null;

  return {
    kickoff: new Date(match.utcDate),
    home: match.home,
    away: match.away,
    competition: match.competition,
    venue: match.venue,
    homeBadge: match.homeLogo,
    awayBadge: match.awayLogo,
  };
}

export interface LastMatchInfo {
  /** API-Football fixture id — tafsilot sahifasi uchun (bazadan kelsa null) */
  fixtureId: number | null;
  utcDate: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  homeBadge: string | null;
  awayBadge: string | null;
}

/**
 * Oxirgi o'ynalgan o'yin — bosh sahifadagi karta uchun.
 * API-Football birinchi: u fixture id beradi, ya'ni karta tafsilot
 * sahifasiga (gollar, kartochkalar, statistika) havola qila oladi.
 */
export async function getLastMatch(): Promise<LastMatchInfo | null> {
  const fromApi = (await fetchLastFixtures(1))?.[0];
  if (fromApi && fromApi.homeScore !== null && fromApi.awayScore !== null) {
    return {
      fixtureId: fromApi.id,
      utcDate: fromApi.utcDate,
      home: fromApi.home,
      away: fromApi.away,
      homeScore: fromApi.homeScore,
      awayScore: fromApi.awayScore,
      competition: fromApi.competition,
      homeBadge: fromApi.homeLogo,
      awayBadge: fromApi.awayLogo,
    };
  }

  const fromDb = await readLastMatch();
  if (!fromDb) return null;

  return {
    fixtureId: null,
    utcDate: fromDb.kickoff.toISOString(),
    home: fromDb.homeTeam,
    away: fromDb.awayTeam,
    homeScore: fromDb.homeScore ?? 0,
    awayScore: fromDb.awayScore ?? 0,
    competition: competitionLabel(fromDb.competition),
    homeBadge: fromDb.homeBadge,
    awayBadge: fromDb.awayBadge,
  };
}

export async function getTimeline(): Promise<TimelineItem[]> {
  return TIMELINE;
}

export async function getLegends(): Promise<Legend[]> {
  return LEGENDS;
}
