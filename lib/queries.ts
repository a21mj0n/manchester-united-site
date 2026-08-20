import { FIXTURES, LEGENDS, RESULTS, SQUAD, STANDINGS, TIMELINE } from "./data";
import { readFixtures, readResults, readSquad, readStandings } from "./db-read";
import { fetchSquad } from "./football-api";
import { fetchFixtures, fetchResults, fetchStandings, type StandingsResult } from "./sportsdb";
import type { Fixture, Legend, Player, Result, Standing, TimelineItem } from "./types";

/**
 * Ma'lumot qatlami (data layer).
 *
 * Uch bosqichli manba:
 *   1. Baza — kunlik sinxronizatsiya to'ldiradi (lib/sync/run.ts)
 *   2. Jonli API — baza hali bo'sh bo'lsa
 *   3. Demo ma'lumot — hech biri ishlamasa
 * Shu sababli sayt hech qachon bo'sh bo'lim ko'rsatmaydi.
 * Tarix va afsonalar o'zgarmaydi — ular demo massivlarda qoladi.
 *
 * Barchasi `async` —
 * shuning uchun keyinchalik bazaga (Postgres/Prisma, Supabase, MongoDB…)
 * yoki tashqi API ga o'tkazish uchun faqat shu fayl ichini o'zgartirish yetarli.
 * Chaqiruvchi server komponentlari o'zgarishsiz qoladi.
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

export async function getStandings(): Promise<StandingsResult> {
  return (
    (await readStandings()) ??
    (await fetchStandings()) ?? {
      rows: STANDINGS,
      season: "namunaviy",
      isPreviousSeason: false,
    }
  );
}

export async function getTimeline(): Promise<TimelineItem[]> {
  return TIMELINE;
}

export async function getLegends(): Promise<Legend[]> {
  return LEGENDS;
}
