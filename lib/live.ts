/**
 * Jonli o'yin — API limitini tejash uchun faqat "o'yin oynasida"
 * so'raladi: boshlanishidan 15 daqiqa oldin va tugashidan keyingi
 * chegaragacha. Oynadan tashqarida API ga umuman murojaat qilinmaydi.
 *
 * Eng yaqin o'yin vaqti bazadan olinadi (kunlik sinxronizatsiya
 * to'ldiradi), shu bois qo'shimcha so'rov sarflanmaydi.
 */

import { fetchLiveUnitedMatch } from "./football/fixtures";
import { hasFootballKey } from "./football/client";
import { readNextKickoff } from "./db-read";
import type { MatchItem } from "@/types/football";

/** O'yin boshlanishidan necha daqiqa oldin kuzatuv boshlanadi */
const BEFORE_MIN = 15;
/** Boshlanganidan keyin necha daqiqagacha (qo'shimcha vaqt va penaltilar bilan) */
const AFTER_MIN = 150;

export async function getLiveMatch(): Promise<MatchItem | null> {
  if (!hasFootballKey()) return null;

  const next = await readNextKickoff();
  if (!next) return null;

  const now = Date.now();
  const kickoff = next.kickoff.getTime();
  const inWindow =
    now >= kickoff - BEFORE_MIN * 60_000 && now <= kickoff + AFTER_MIN * 60_000;
  if (!inWindow) return null;

  return fetchLiveUnitedMatch();
}
