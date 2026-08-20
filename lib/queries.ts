import { FIXTURES, LEGENDS, RESULTS, SQUAD, STANDINGS, TIMELINE } from "./data";
import { fetchSquad } from "./football-api";
import { fetchFixtures, fetchResults, fetchStandings, type StandingsResult } from "./sportsdb";
import type { Fixture, Legend, Player, Result, Standing, TimelineItem } from "./types";

/**
 * Ma'lumot qatlami (data layer).
 *
 * O'yinlar va turnir jadvali — TheSportsDB (kalit shart emas).
 * Jamoa tarkibi — API-Football (FOOTBALL_API_KEY kerak).
 * Har ikkalasi javob bermasa demo ma'lumotga tushadi, ya'ni sayt
 * baribir ishlayveradi. Tarix va afsonalar demo massivlarda qoladi.
 *
 * Barchasi `async` —
 * shuning uchun keyinchalik bazaga (Postgres/Prisma, Supabase, MongoDB…)
 * yoki tashqi API ga o'tkazish uchun faqat shu fayl ichini o'zgartirish yetarli.
 * Chaqiruvchi server komponentlari o'zgarishsiz qoladi.
 */

export async function getSquad(): Promise<Player[]> {
  return (await fetchSquad()) ?? SQUAD;
}

export async function getFixtures(): Promise<Fixture[]> {
  return (await fetchFixtures()) ?? FIXTURES;
}

export async function getResults(): Promise<Result[]> {
  return (await fetchResults()) ?? RESULTS;
}

export async function getStandings(): Promise<StandingsResult> {
  return (
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
