/**
 * Bazadagi `Match.extId` manba prefiksi bilan saqlanadi:
 * "af:1557368" (API-Football) yoki "sdb:2052641" (TheSportsDB).
 *
 * Faqat API-Football id'si bo'yicha o'yin tafsilotlari (voqealar,
 * tarkiblar, statistika) olinadi — shuning uchun sayt qaysi yozuv
 * tafsilot sahifasiga havola qila olishini shu yerdan biladi.
 *
 * Prefikssiz eski yozuvlar ham uchraydi — ular manbasi noma'lum
 * hisoblanadi va havola qilinmaydi.
 */

export const API_PREFIX = "af:";

/** API-Football fixture id, yoki boshqa manba bo'lsa null. */
export function apiFixtureId(extId: string): number | null {
  if (!extId.startsWith(API_PREFIX)) return null;
  const id = Number(extId.slice(API_PREFIX.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}
