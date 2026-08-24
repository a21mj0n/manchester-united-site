/**
 * API-Football uchun yagona client — barcha so'rovlar shu yerdan o'tadi.
 *
 * Kalit faqat serverda (FOOTBALL_API_KEY) saqlanadi; brauzer API bilan
 * bevosita gaplashmaydi — Next.js server komponentlari va route
 * handlerlar oraliq qatlam bo'ladi.
 *
 * API xatolarni ham HTTP 200 bilan qaytarishi mumkin (errors maydoni),
 * shuning uchun ikkalasi ham tekshiriladi. Har qanday xatolikda null —
 * chaqiruvchi tomon zaxira manbaga (baza/TheSportsDB/demo) tushadi va
 * maxfiy tafsilotlar frontendga chiqmaydi.
 */

const BASE = process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";
const TIMEOUT_MS = 8000;

export function hasFootballKey(): boolean {
  return Boolean(process.env.FOOTBALL_API_KEY);
}

/* =========================================================
   Limitni asrash
   =========================================================
   Bepul tarifda ayrim so'rovlar doim xato qaytaradi (masalan
   joriy mavsum yoki next/last parametri). Next.js keshi muddati
   tugagach so'rov qaytadan ketadi — kuniga 100 ta limit shunday
   behuda sarflanadi.

   Shuning uchun xato bergan so'rov qisqa muddatga "to'xtatiladi":
   tarif xatosi o'z-o'zidan tuzalmaydi (uzoq kutamiz), tarmoq
   xatosi esa o'tkinchi bo'lishi mumkin (qisqa kutamiz).
   Ro'yxat xotirada — jarayon qayta ishga tushsa tozalanadi. */

const PLAN_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const ERROR_COOLDOWN_MS = 60 * 1000;
/** Limit tugaganda hamma so'rovlar shuncha vaqtga to'xtatiladi */
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000;

const cooldowns = new Map<string, number>();
let quotaBlockedUntil = 0;

function isPlanError(errors: unknown): boolean {
  return (
    typeof errors === "object" &&
    errors !== null &&
    !Array.isArray(errors) &&
    "plan" in errors
  );
}

interface ApiEnvelope<T> {
  errors?: unknown;
  results?: number;
  response?: T[];
}

/**
 * GET so'rov. Muvaffaqiyatda response massivi, xatolikda null.
 * revalidate — Next.js data kesh muddati (soniya); bir xil so'rov shu
 * muddat ichida API ga qayta bormaydi, limit tejaladi.
 */
export async function apiGet<T>(
  endpoint: string,
  params: Record<string, string | number>,
  revalidate: number,
): Promise<T[] | null> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return null;

  const query = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const url = `${BASE}/${endpoint}${query ? `?${query}` : ""}`;

  const now = Date.now();
  if (now < quotaBlockedUntil) return null;

  const cacheKey = `${endpoint}?${query}`;
  const blockedUntil = cooldowns.get(cacheKey);
  if (blockedUntil !== undefined && now < blockedUntil) return null;

  try {
    const response = await fetch(url, {
      headers: { "x-apisports-key": key },
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Kunlik limit tugagan bo'lsa boshqa so'rovlarni ham to'xtatamiz
    const remaining = response.headers.get("x-ratelimit-requests-remaining");
    if (remaining !== null && Number(remaining) <= 0) {
      quotaBlockedUntil = Date.now() + QUOTA_COOLDOWN_MS;
      console.error("[football] kunlik limit tugadi — so'rovlar to'xtatildi");
    }

    if (!response.ok) {
      console.error(`[football] ${endpoint}: HTTP ${response.status}`);
      cooldowns.set(cacheKey, Date.now() + ERROR_COOLDOWN_MS);
      return null;
    }

    const data = (await response.json()) as ApiEnvelope<T>;

    const errors = data.errors;
    const hasErrors =
      errors &&
      ((Array.isArray(errors) && errors.length > 0) ||
        (typeof errors === "object" && Object.keys(errors).length > 0));
    if (hasErrors) {
      const plan = isPlanError(errors);
      console.error(
        `[football] ${endpoint}${plan ? " (tarif yopiq)" : ""}:`,
        JSON.stringify(errors).slice(0, 300),
      );
      cooldowns.set(
        cacheKey,
        Date.now() + (plan ? PLAN_COOLDOWN_MS : ERROR_COOLDOWN_MS),
      );
      return null;
    }

    cooldowns.delete(cacheKey);
    return data.response ?? [];
  } catch (error) {
    console.error(`[football] ${endpoint}:`, error);
    cooldowns.set(cacheKey, Date.now() + ERROR_COOLDOWN_MS);
    return null;
  }
}
