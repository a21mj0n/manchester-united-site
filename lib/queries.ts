import { FIXTURES, LEGENDS, RESULTS, SQUAD, STANDINGS, TIMELINE } from "./data";
import type { Fixture, Legend, Player, Result, Standing, TimelineItem } from "./types";

/**
 * Ma'lumot qatlami (data layer).
 *
 * Hozir demo massivlarni qaytaradi, lekin barchasi `async` —
 * shuning uchun keyinchalik bazaga (Postgres/Prisma, Supabase, MongoDB…)
 * yoki tashqi API ga o'tkazish uchun faqat shu fayl ichini o'zgartirish yetarli.
 * Chaqiruvchi server komponentlari o'zgarishsiz qoladi.
 */

export async function getSquad(): Promise<Player[]> {
  return SQUAD;
}

export async function getFixtures(): Promise<Fixture[]> {
  return FIXTURES;
}

export async function getResults(): Promise<Result[]> {
  return RESULTS;
}

export async function getStandings(): Promise<Standing[]> {
  return STANDINGS;
}

export async function getTimeline(): Promise<TimelineItem[]> {
  return TIMELINE;
}

export async function getLegends(): Promise<Legend[]> {
  return LEGENDS;
}
