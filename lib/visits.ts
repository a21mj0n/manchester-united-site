import { createHash } from "node:crypto";

import { prisma } from "./prisma";

/**
 * Tashriflar hisoblagichi.
 *
 * Maqsad: homiylar bilan gaplashish va o'sishni ko'rish uchun oddiy
 * raqamlar — kunlik tashrifchilar, ko'rishlar va eng ko'p ochilgan sahifalar.
 *
 * Shaxsiy ma'lumot saqlanmaydi. Tashrifchi IP + brauzer + kunlik tuzdan
 * olingan xesh bilan belgilanadi: bir kun ichida bir odam bir marta
 * sanaladi, ertasi kuni xesh boshqa bo'ladi va uni qaytarib bo'lmaydi.
 * Shuning uchun 7 va 30 kunlik "tashrifchilar" bu kunlik noyoblar yig'indisi.
 */

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
/** Necha kunlik tarix saqlanadi */
export const RETENTION_DAYS = 90;
/** Bir tashrifchi bir sahifani bir kunda ko'pi bilan shuncha marta sanaladi */
const MAX_COUNT_PER_ROW = 100;

const BOT_RE = /bot|crawl|spider|slurp|preview|fetch|monitor|curl|wget|python|headless|lighthouse/i;

/** Toshkent vaqti bo'yicha YYYY-MM-DD */
export function tashkentDay(date = new Date()): string {
  return new Date(date.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Bugundan `days` kun oldingi sana (Toshkent), YYYY-MM-DD */
export function daysAgo(days: number, from = new Date()): string {
  return tashkentDay(new Date(from.getTime() - days * 86_400_000));
}

function visitorHash(ip: string, ua: string, day: string): string {
  const salt = process.env.AUTH_SECRET ?? "red-devils";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

/** Sanalmaydigan yo'llar */
function isCountablePath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  return !/^\/(admin|login|api|_next)(\/|$)/.test(path);
}

export function normalizePath(raw: string): string | null {
  let path = raw.trim();
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  const h = path.indexOf("#");
  if (h >= 0) path = path.slice(0, h);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (!path || path.length > 200 || !isCountablePath(path)) return null;
  return path;
}

export interface HitInput {
  path: string;
  ip: string;
  userAgent: string;
}

/** Bitta tashrifni yozadi. Botlar va ichki sahifalar o'tkazib yuboriladi. */
export async function recordVisit({ path: rawPath, ip, userAgent }: HitInput): Promise<boolean> {
  const path = normalizePath(rawPath);
  if (!path) return false;
  if (!userAgent || BOT_RE.test(userAgent)) return false;

  const day = tashkentDay();
  const visitor = visitorHash(ip, userAgent, day);

  const existing = await prisma.visit.findUnique({
    where: { day_visitor_path: { day, visitor, path } },
    select: { count: true },
  });

  if (existing) {
    if (existing.count >= MAX_COUNT_PER_ROW) return false;
    await prisma.visit.update({
      where: { day_visitor_path: { day, visitor, path } },
      data: { count: { increment: 1 } },
    });
  } else {
    await prisma.visit.create({ data: { day, visitor, path } });
  }
  return true;
}

/* ---------------- Statistika ---------------- */

export interface DayStat {
  day: string;
  views: number;
  visitors: number;
}

export interface PathStat {
  path: string;
  views: number;
  visitors: number;
}

export interface PeriodStat {
  views: number;
  visitors: number;
}

export interface VisitStats {
  today: PeriodStat;
  week: PeriodStat;
  month: PeriodStat;
  /** Oxirgi 30 kun, bo'sh kunlar ham 0 bilan */
  daily: DayStat[];
  /** Oxirgi 30 kunda eng ko'p ochilgan sahifalar */
  topPaths: PathStat[];
}

type RawDay = { day: string; views: number | bigint; visitors: number | bigint };
type RawPath = { path: string; views: number | bigint; visitors: number | bigint };

const num = (v: number | bigint | null | undefined) => Number(v ?? 0);

export async function getVisitStats(now = new Date()): Promise<VisitStats> {
  const today = tashkentDay(now);
  const weekStart = daysAgo(6, now);
  const monthStart = daysAgo(29, now);

  const rows = await prisma.$queryRaw<RawDay[]>`
    SELECT day, SUM(count) AS views, COUNT(DISTINCT visitor) AS visitors
    FROM Visit WHERE day >= ${monthStart}
    GROUP BY day ORDER BY day`;

  const byDay = new Map(rows.map((r) => [r.day, { views: num(r.views), visitors: num(r.visitors) }]));

  const daily: DayStat[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i, now);
    const s = byDay.get(day);
    daily.push({ day, views: s?.views ?? 0, visitors: s?.visitors ?? 0 });
  }

  const sum = (from: string): PeriodStat =>
    daily
      .filter((d) => d.day >= from)
      .reduce((acc, d) => ({ views: acc.views + d.views, visitors: acc.visitors + d.visitors }), {
        views: 0,
        visitors: 0,
      });

  const topRaw = await prisma.$queryRaw<RawPath[]>`
    SELECT path, SUM(count) AS views, COUNT(DISTINCT visitor) AS visitors
    FROM Visit WHERE day >= ${monthStart}
    GROUP BY path ORDER BY views DESC LIMIT 15`;

  return {
    today: sum(today),
    week: sum(weekStart),
    month: sum(monthStart),
    daily,
    topPaths: topRaw.map((r) => ({ path: r.path, views: num(r.views), visitors: num(r.visitors) })),
  };
}

/** Eski yozuvlarni o'chiradi, o'chirilganlar sonini qaytaradi. */
export async function pruneVisits(days = RETENTION_DAYS): Promise<number> {
  const cutoff = daysAgo(days);
  const result = await prisma.visit.deleteMany({ where: { day: { lt: cutoff } } });
  return result.count;
}
