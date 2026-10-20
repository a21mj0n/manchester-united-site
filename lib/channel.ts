/**
 * Telegram kanal postlari — bot kanalga avtomatik yozadi.
 *
 * Ikki xil post:
 *   1. O'yin kuni ertalab (Toshkent vaqti 08:00 dan keyin) — "Bugun o'yin"
 *   2. O'yin tugagach — natija va jadvaldagi o'rin
 *
 * Yurish tartibi: /api/cron/channel ni systemd timer har 30 daqiqada
 * chaqiradi. Avval football-data.org dan yangi hisoblar olinib bazaga
 * yoziladi (shunda sayt ham natijani ertalabgacha kutmaydi), keyin
 * yuborilmagan postlar yuboriladi.
 *
 * Har bir post Setting jadvalida "tg:<tur>:<extId>" kaliti bilan
 * belgilanadi — timer qayta chaqirganda takror yuborilmaydi.
 */

import { competitionLabel, currentApiSeason } from "@/config/football";
import { SITE_URL, TELEGRAM_CHANNEL } from "@/config/social";
import { apiFixtureId } from "./match-id";
import { fetchStandings as fetchFdStandings, fetchTeamMatches } from "./footballdata";
import { prisma } from "./prisma";
import { sendTelegramTo } from "./telegram";

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
/** O'yin kuni posti shu soatdan (Toshkent) oldin yuborilmaydi */
const MATCHDAY_POST_HOUR = 8;
/** Natija posti o'yin boshlanganidan keyin shuncha soat ichida yuboriladi */
const RESULT_WINDOW_HOURS = 24;
/** Bir o'yin ikki manbada shu oraliqda bo'lsa — bir o'yin */
const SAME_MATCH_WINDOW_MS = 3 * 60 * 60 * 1000;

const POST_PREFIX = "tg:";

/** Postlar yuboriladigan kanal: env ustun, bo'lmasa config/social.ts */
export function channelId(): string | null {
  return process.env.TELEGRAM_CHANNEL || TELEGRAM_CHANNEL?.handle || null;
}

export function channelConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && channelId());
}

/* ---------------- Matn ---------------- */

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** href ichidagi manzil — manba havolasida & va " bo'lishi mumkin */
function escapeAttr(url: string): string {
  return escapeHtml(url).replaceAll('"', "&quot;");
}

function tashkent(d: Date): Date {
  return new Date(d.getTime() + TASHKENT_OFFSET_MS);
}

function tashkentDay(d: Date): string {
  return tashkent(d).toISOString().slice(0, 10);
}

function tashkentTime(d: Date): string {
  const t = tashkent(d);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}

function isUnited(name: string): boolean {
  return /manchester united|man utd|man united/i.test(name);
}

/**
 * Har bir postning pastki qismi: sayt havolasi va kanal manzili.
 * Kanal manzili bo'lmasa faqat sayt qoladi.
 */
function signature(): string {
  const parts = [`<a href="${SITE_URL}">Sayt</a>`];
  const handle = TELEGRAM_CHANNEL?.handle;
  if (handle) parts.push(handle);
  return parts.join(" · ");
}

interface MatchRow {
  id: number;
  extId: string;
  kickoff: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: string;
  venue: string | null;
}

export function buildMatchdayPost(m: MatchRow): string {
  const home = isUnited(m.homeTeam);
  const where = m.venue ? escapeHtml(m.venue) : home ? "Old Trafford" : "Mehmonda";
  return [
    "🔴 <b>Bugun o'yin!</b>",
    "",
    `<b>${escapeHtml(m.homeTeam)} — ${escapeHtml(m.awayTeam)}</b>`,
    `🏆 ${escapeHtml(competitionLabel(m.competition))}`,
    `🕘 ${tashkentTime(m.kickoff)} (Toshkent vaqti) · ${where}`,
    "",
    `📺 <a href="${SITE_URL}/tomosha">Qayerda ko'rish</a>`,
    "",
    signature(),
  ].join("\n");
}

export interface TablePosition {
  pos: number;
  points: number;
  played: number;
}

export function buildResultPost(m: MatchRow, table: TablePosition | null): string {
  const hs = m.homeScore ?? 0;
  const as = m.awayScore ?? 0;
  const unitedHome = isUnited(m.homeTeam);
  const diff = unitedHome ? hs - as : as - hs;
  const outcome = diff > 0 ? "🎉 G'alaba!" : diff < 0 ? "😔 Mag'lubiyat" : "🤝 Durang";

  const fixtureId = apiFixtureId(m.extId);
  const link = fixtureId ? `${SITE_URL}/matches/${fixtureId}` : `${SITE_URL}/matches`;

  const lines = [
    "⚽ <b>O'yin tugadi</b>",
    "",
    `<b>${escapeHtml(m.homeTeam)} ${hs} : ${as} ${escapeHtml(m.awayTeam)}</b>`,
    `🏆 ${escapeHtml(competitionLabel(m.competition))} · ${outcome}`,
  ];
  if (table && /premier/i.test(m.competition)) {
    lines.push(`📊 Jadvalda ${table.pos}-o'rin · ${table.points} ochko (${table.played} o'yin)`);
  }
  lines.push("", `<a href="${link}">Tafsilotlar</a>`, "", signature());
  return lines.join("\n");
}

/* ---------------- Yuborilganlar ro'yxati ---------------- */

export interface PostedEntry {
  key: string;
  at: string;
  text: string;
}

async function alreadyPosted(key: string): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row !== null;
}

async function markPosted(key: string, text: string): Promise<void> {
  const value = JSON.stringify({ at: new Date().toISOString(), text });
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

/** Oxirgi yuborilgan postlar — admin panel uchun. */
export async function recentPosts(limit = 8): Promise<PostedEntry[]> {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: POST_PREFIX } },
  });
  const entries: PostedEntry[] = [];
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.value) as { at?: string; text?: string };
      entries.push({ key: row.key, at: parsed.at ?? "", text: parsed.text ?? "" });
    } catch {
      entries.push({ key: row.key, at: "", text: row.value });
    }
  }
  return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/* ---------------- Hisoblarni yangilash ---------------- */

/**
 * football-data.org dan tugagan o'yinlar hisobini olib, bazadagi hali
 * hisobsiz yozuvlarga yozadi. Manbadan qat'i nazar vaqt bo'yicha
 * moslanadi (extId prefiksi farq qilishi mumkin).
 */
async function refreshScores(): Promise<number> {
  const now = Date.now();
  const pending = await prisma.match.findMany({
    where: {
      homeScore: null,
      kickoff: {
        gte: new Date(now - RESULT_WINDOW_HOURS * 3600 * 1000),
        lte: new Date(now),
      },
    },
  });
  if (pending.length === 0) return 0;

  const fresh = await fetchTeamMatches(currentApiSeason(), 0);
  if (!fresh) return 0;

  let updated = 0;
  for (const row of pending) {
    const match = fresh.find(
      (m) =>
        m.homeScore !== null &&
        m.awayScore !== null &&
        Math.abs(m.kickoff.getTime() - row.kickoff.getTime()) < SAME_MATCH_WINDOW_MS,
    );
    if (!match) continue;
    await prisma.match.update({
      where: { id: row.id },
      data: { homeScore: match.homeScore, awayScore: match.awayScore },
    });
    updated++;
  }
  return updated;
}

async function unitedTablePosition(): Promise<TablePosition | null> {
  // Avval jonli jadval (natija endi chiqqan bo'lsa baza eskirgan bo'ladi)
  const fresh = await fetchFdStandings(0);
  const freshRow = fresh?.rows.find((r) => r.isUnited);
  if (freshRow) return { pos: freshRow.pos, points: freshRow.points, played: freshRow.played };

  const row = await prisma.standingRow.findFirst({ where: { isUnited: true } });
  return row ? { pos: row.pos, points: row.points, played: row.played } : null;
}

/* ---------------- Asosiy yurish ---------------- */

export interface ChannelRunResult {
  configured: boolean;
  scoresUpdated: number;
  sent: string[];
  skipped: string[];
}

export async function runChannelPosts(now = new Date()): Promise<ChannelRunResult> {
  const result: ChannelRunResult = {
    configured: channelConfigured(),
    scoresUpdated: 0,
    sent: [],
    skipped: [],
  };

  try {
    result.scoresUpdated = await refreshScores();
  } catch (error) {
    console.error("[channel] hisoblarni yangilashda xatolik:", error);
  }

  if (!result.configured) {
    result.skipped.push("kanal sozlanmagan (TELEGRAM_BOT_TOKEN yoki kanal yo'q)");
    return result;
  }
  const chat = channelId() as string;

  // 1) Bugungi o'yinlar
  const today = tashkentDay(now);
  const hour = tashkent(now).getUTCHours();
  const dayStart = new Date(now.getTime() - 36 * 3600 * 1000);
  const dayEnd = new Date(now.getTime() + 36 * 3600 * 1000);
  const nearby = await prisma.match.findMany({
    where: { kickoff: { gte: dayStart, lte: dayEnd } },
    orderBy: { kickoff: "asc" },
  });

  for (const m of nearby) {
    if (tashkentDay(m.kickoff) !== today) continue;
    if (m.kickoff.getTime() < now.getTime()) continue; // boshlanib bo'lgan
    const key = `${POST_PREFIX}matchday:${m.extId}`;
    if (hour < MATCHDAY_POST_HOUR) {
      result.skipped.push(`${key}: ${MATCHDAY_POST_HOUR}:00 gacha kutiladi`);
      continue;
    }
    if (await alreadyPosted(key)) continue;

    const text = buildMatchdayPost(m);
    if (await sendTelegramTo(chat, text)) {
      await markPosted(key, text);
      result.sent.push(key);
    } else {
      result.skipped.push(`${key}: Telegram qabul qilmadi`);
    }
  }

  // 2) Natijalar
  const finished = await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      kickoff: { gte: new Date(now.getTime() - RESULT_WINDOW_HOURS * 3600 * 1000), lte: now },
    },
    orderBy: { kickoff: "asc" },
  });

  let table: TablePosition | null | undefined;
  for (const m of finished) {
    const key = `${POST_PREFIX}result:${m.extId}`;
    if (await alreadyPosted(key)) continue;

    if (table === undefined) table = await unitedTablePosition();
    const text = buildResultPost(m, table);
    if (await sendTelegramTo(chat, text)) {
      await markPosted(key, text);
      result.sent.push(key);
    } else {
      result.skipped.push(`${key}: Telegram qabul qilmadi`);
    }
  }

  return result;
}

/* ---------------- Yangiliklar ---------------- */

interface NewsLike {
  id: number;
  title: string;
  excerpt: string;
  tag: string;
  sourceName: string | null;
  sourceUrl: string | null;
}

/** Yangilik posti: sarlavha, qisqa matn va havola (manba yoki sayt). */
export function buildNewsPost(n: NewsLike): string {
  const link = n.sourceUrl ?? `${SITE_URL}/#news`;
  const lines = [`📰 <b>${escapeHtml(n.title)}</b>`];
  if (n.excerpt.trim()) lines.push("", escapeHtml(n.excerpt.trim()));
  lines.push(
    "",
    n.sourceUrl && n.sourceName
      ? `🔗 <a href="${escapeAttr(link)}">To'liq o'qish</a> · Manba: ${escapeHtml(n.sourceName)}`
      : `🔗 <a href="${escapeAttr(link)}">Saytda o'qish</a>`,
  );
  lines.push("", signature());
  return lines.join("\n");
}

export function newsPostKey(id: number): string {
  return `${POST_PREFIX}news:${id}`;
}

/**
 * Yangilikni kanalga yuboradi. Qayta yuborish mumkin — kalit faqat
 * oxirgi yuborilgan vaqtni saqlaydi. Natija: ok yoki xato sababi.
 */
export async function sendNewsToChannel(
  id: number,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const chat = channelId();
  if (!chat || !channelConfigured()) {
    return { ok: false, error: "Kanal sozlanmagan (bot tokeni yoki kanal yo'q)." };
  }

  const post = await prisma.newsPost.findUnique({ where: { id } });
  if (!post) return { ok: false, error: "Yangilik topilmadi." };

  const text = buildNewsPost(post);
  const sent = await sendTelegramTo(chat, text);
  if (!sent) return { ok: false, error: "Telegram qabul qilmadi — bot kanalda adminmi?" };

  await markPosted(newsPostKey(id), text);
  return { ok: true, text };
}

/** Kanalga yuborilgan yangiliklar: id → yuborilgan vaqt (ISO). */
export async function newsChannelSent(): Promise<Map<number, string>> {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: `${POST_PREFIX}news:` } },
  });
  const map = new Map<number, string>();
  for (const row of rows) {
    const id = Number(row.key.slice(`${POST_PREFIX}news:`.length));
    if (!Number.isInteger(id)) continue;
    try {
      map.set(id, (JSON.parse(row.value) as { at?: string }).at ?? "");
    } catch {
      map.set(id, "");
    }
  }
  return map;
}

/** Admin paneldan sinov xabari — kanal va bot to'g'ri ulanganini tekshirish. */
export async function sendChannelTest(): Promise<boolean> {
  const chat = channelId();
  if (!chat) return false;
  return sendTelegramTo(
    chat,
    `🔴 <b>Red Devils Uzbekistan</b>\nSayt bilan bog'landi: o'yin kuni va natijalar endi shu yerda avtomatik chiqadi.\n\n${signature()}`,
  );
}
