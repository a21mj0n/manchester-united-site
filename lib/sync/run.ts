import { prisma } from "../prisma";
import { fetchSquad } from "../football/players";
import { fetchFixtures, fetchResults, fetchStandings } from "../sportsdb";
import {
  fetchSquad as fetchFdSquad,
  fetchStandings as fetchFdStandings,
  fetchTeamMatches,
  hasFootballDataKey,
} from "../footballdata";
import { badgeFor, fetchBadgeMap, localizeBadges } from "../badges";
import { hasFootballKey } from "../football/client";
import { fetchLeagueStandings } from "../football/standings";
import { fetchSeasonFixtures } from "../football/fixtures";
import { verifyTeamId } from "../football/teams";
import { currentApiSeason } from "@/config/football";
import type { Player } from "../types";
import { pruneVisits } from "../visits";

/**
 * Kunlik sinxronizatsiya: ochiq manbalardan ma'lumot olib bazaga yozadi.
 *
 * Manbalar tartibi: API-Football (kalit bo'lsa) → football-data.org
 * (bepul tarif) → TheSportsDB (juda cheklangan zaxira).
 *
 * Yangiliklar bu yerga kirmaydi — ular admin panelda qo'lda yoziladi
 * (/admin/news).
 *
 * Har bir bo'lim mustaqil — biri yiqilsa qolganlari baribir bajariladi.
 * Natija SyncLog jadvaliga yoziladi.
 */

export interface SectionResult {
  section: string;
  ok: boolean;
  count: number;
  message: string;
}

/* ---------------- Tarkib ---------------- */

/**
 * Akademiya/zaxira o'yinchisini aniqlash yosh chegarasi.
 *
 * 18 tanlangan, 20 emas: 19-20 yoshda allaqachon asosiy tarkibda
 * muntazam o'ynaydigan futbolchilar bo'ladi (masalan Mainoo, Yoro).
 * Ular orasidan zaxiradagilarini raqam takrorlanishi qoidasi ajratadi.
 */
const ACADEMY_MAX_AGE = 18;

/**
 * API "akademiya" degan maydon bermaydi, shuning uchun ikki belgidan
 * foydalanamiz:
 *   1. Yosh — 18 va undan kichik
 *   2. Raqam takrorlanishi — bir xil raqamli o'yinchilar orasida
 *      yoshi kichigi zaxira hisoblanadi (masalan #2: Kamason 19 va Dalot 26)
 */
function markAcademy(players: { id: number; num: number; age?: number }[]): Set<number> {
  const academy = new Set<number>();

  for (const p of players) {
    if (p.age !== undefined && p.age <= ACADEMY_MAX_AGE) academy.add(p.id);
  }

  const byNumber = new Map<number, typeof players>();
  for (const p of players) {
    if (!p.num) continue;
    const list = byNumber.get(p.num) ?? [];
    list.push(p);
    byNumber.set(p.num, list);
  }

  for (const list of byNumber.values()) {
    if (list.length < 2) continue;
    const oldest = Math.max(...list.map((p) => p.age ?? 0));
    for (const p of list) {
      if ((p.age ?? 0) < oldest) academy.add(p.id);
    }
  }

  return academy;
}

/** Ismni solishtirish uchun soddalashtiradi: diakritika va belgilar olib tashlanadi. */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function surname(name: string): string {
  const parts = normalizeName(name).split(" ");
  return parts[parts.length - 1] ?? "";
}

type PlayerRow = Awaited<ReturnType<typeof prisma.player.findMany>>[number];

/**
 * Boshqa manba davridan qolgan yozuvni ism bo'yicha topadi, shunda
 * manba almashganda o'yinchi ikki marta paydo bo'lmaydi va eski
 * yozuvdagi rasm, identifikatorlar va admin belgilari saqlanib qoladi.
 *
 * Avval to'liq ism, keyin familiya + raqam ("B. Fernandes" ↔ "Bruno
 * Fernandes"). Bir yozuv ikki o'yinchiga berilmaydi.
 */
function findLegacyRow(
  candidates: PlayerRow[],
  matched: Set<number>,
  p: Player,
): PlayerRow | undefined {
  const full = normalizeName(p.name);
  const free = candidates.filter((r) => !matched.has(r.id));

  return (
    free.find((r) => normalizeName(r.name) === full) ??
    free.find(
      (r) =>
        surname(r.name) === surname(p.name) &&
        (r.num === p.num || r.num === 0 || p.num === 0),
    )
  );
}

/** API-Football tarkibi — apiId bo'yicha saqlanadi, rasm ham keladi. */
async function syncSquadFromApi(players: Player[]): Promise<SectionResult> {
  const apiIds = players.map((p) => p.id);
  const academy = markAcademy(players);

  const existing = await prisma.player.findMany();
  const byApiId = new Map(
    existing.filter((r) => r.apiId !== null).map((r) => [r.apiId as number, r]),
  );
  // apiId'siz yozuvlar — football-data.org davridan yoki qo'lda qo'shilgan
  const legacy = existing.filter((r) => r.apiId === null);
  const matched = new Set<number>();

  for (const p of players) {
    const row = byApiId.get(p.id) ?? findLegacyRow(legacy, matched, p);
    const data = {
      num: p.num,
      name: p.name,
      pos: p.pos,
      posName: p.posName,
      age: p.age ?? null,
      photo: p.photo ?? null,
      country: p.country ?? null,
      // Admin qo'lda belgilagan guruh ustun turadi
      isAcademy: row?.academyOverride ?? academy.has(p.id),
    };

    if (row) {
      matched.add(row.id);
      await prisma.player.update({ where: { id: row.id }, data: { apiId: p.id, ...data } });
    } else {
      await prisma.player.create({ data: { apiId: p.id, ...data } });
    }
  }

  // Jamoadan ketganlarni olib tashlaymiz.
  // Qo'lda qo'shilganlarga tegilmaydi — manba ularni bilmaydi.
  const removed = await prisma.player.deleteMany({
    where: { manual: false, OR: [{ apiId: null }, { apiId: { notIn: apiIds } }] },
  });

  const manual = await prisma.player.count({ where: { manual: true } });
  const parts = [`${players.length - academy.size} asosiy, ${academy.size} akademiya`];
  if (manual > 0) parts.push(`${manual} tasi qo'lda qo'shilgan`);
  if (removed.count > 0) parts.push(`${removed.count} tasi ro'yxatdan chiqdi`);

  return {
    section: "tarkib",
    ok: true,
    count: players.length,
    message: `API-Football · ${parts.join(" · ")}`,
  };
}

/**
 * football-data.org tarkibi — fdId bo'yicha saqlanadi.
 *
 * Eski (API-Football davridagi) yozuvlar ism bo'yicha topilib, ustiga
 * yoziladi: shunda apiId va rasm saqlanib qoladi, kalit qaytganda
 * statistika sahifalari darhol ishlaydi. Manba rasm bermaydi, shuning
 * uchun photo maydoniga tegilmaydi.
 */
async function syncSquadFromFootballData(players: Player[]): Promise<SectionResult> {
  const fdIds = players.map((p) => p.id);
  const academy = markAcademy(players);

  const existing = await prisma.player.findMany();
  const byFdId = new Map(
    existing.filter((r) => r.fdId !== null).map((r) => [r.fdId as number, r]),
  );
  // fdId'siz yozuvlar — API-Football davridan yoki qo'lda qo'shilgan
  const legacy = existing.filter((r) => r.fdId === null);
  const matched = new Set<number>();
  let linked = 0;

  for (const p of players) {
    const row = byFdId.get(p.id) ?? findLegacyRow(legacy, matched, p);

    const data = {
      num: p.num,
      name: p.name,
      pos: p.pos,
      posName: p.posName,
      age: p.age ?? null,
      country: p.country ?? null,
      isAcademy: row?.academyOverride ?? academy.has(p.id),
      fdId: p.id,
    };

    if (row) {
      matched.add(row.id);
      if (row.fdId === null) linked++;
      await prisma.player.update({ where: { id: row.id }, data });
    } else {
      await prisma.player.create({ data });
    }
  }

  // Ro'yxatda yo'q va qo'lda qo'shilmagan o'yinchilar ketgan hisoblanadi
  const removed = await prisma.player.deleteMany({
    where: { manual: false, OR: [{ fdId: null }, { fdId: { notIn: fdIds } }] },
  });

  const manual = await prisma.player.count({ where: { manual: true } });
  const parts = [`${players.length - academy.size} asosiy, ${academy.size} akademiya`];
  if (linked > 0) parts.push(`${linked} tasi eski yozuvga bog'landi`);
  if (manual > 0) parts.push(`${manual} tasi qo'lda qo'shilgan`);
  if (removed.count > 0) parts.push(`${removed.count} tasi ro'yxatdan chiqdi`);

  return {
    section: "tarkib",
    ok: true,
    count: players.length,
    message: `football-data.org · ${parts.join(" · ")}`,
  };
}

async function syncSquad(): Promise<SectionResult> {
  const fromApi = await fetchSquad();
  if (fromApi && fromApi.length > 0) return syncSquadFromApi(fromApi);

  const fromFd = await fetchFdSquad(0);
  if (fromFd && fromFd.length > 0) return syncSquadFromFootballData(fromFd);

  const message = hasFootballKey() || hasFootballDataKey()
    ? "manbalar tarkibni bermadi"
    : "manba kaliti yo'q (FOOTBALL_API_KEY yoki FOOTBALL_DATA_KEY)";
  return { section: "tarkib", ok: false, count: 0, message };
}

/* ---------------- O'yinlar ---------------- */

/** "22-avgust" + "16:30" ni sanaga aylantiradi (Toshkent vaqti). */
function parseKickoff(date: string, time: string): Date | null {
  const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  const m = date.match(/^(\d{1,2})-(\p{L}+)$/u);
  if (!m) return null;

  const day = Number(m[1]);
  const month = MONTHS.indexOf(m[2]);
  if (month < 0) return null;

  const [hh, mm] = time.includes(":") ? time.split(":").map(Number) : [12, 0];

  // Yil ko'rsatilmagan — joriy yildan boshlaymiz, sana o'tib ketgan
  // bo'lsa keyingi yilga o'tkazamiz (mavsum yil chegarasidan o'tadi)
  const now = new Date();
  let year = now.getUTCFullYear();
  // Toshkent vaqtini UTC ga qaytaramiz
  let kickoff = new Date(Date.UTC(year, month, day, hh - 5, mm));
  if (kickoff.getTime() < now.getTime() - 200 * 24 * 3600 * 1000) {
    year += 1;
    kickoff = new Date(Date.UTC(year, month, day, hh - 5, mm));
  }
  return kickoff;
}

/**
 * `extId` manba prefiksi bilan saqlanadi: "af:1557368" (API-Football)
 * yoki "sdb:2052641" (TheSportsDB). Shu bois raqamni ko'rib qaysi
 * manbadan kelganini bilamiz — API-Football id'si bo'lsa saytda
 * o'yin tafsilotlari sahifasiga havola qilish mumkin, TheSportsDB
 * id'si bilan esa bunday sahifa ochilmaydi.
 */
const API_PREFIX = "af:";
const FD_PREFIX = "fd:";
const SPORTSDB_PREFIX = "sdb:";

/** Bitta o'yin ikki manbada shu oraliqda bo'lsa — bir o'yin hisoblanadi */
const SAME_MATCH_WINDOW_MS = 3 * 60 * 60 * 1000;

function overlaps(kickoff: Date, known: Date[]): boolean {
  return known.some((k) => Math.abs(k.getTime() - kickoff.getTime()) < SAME_MATCH_WINDOW_MS);
}

/** API-Football: mavsumning barcha o'yinlari, haqiqiy fixture id bilan. */
async function syncMatchesFromApi(
  badges: Map<string, string>,
): Promise<SectionResult | null> {
  const matches = await fetchSeasonFixtures();
  if (!matches || matches.length === 0) return null;

  const extIds: string[] = [];

  for (const m of matches) {
    const extId = `${API_PREFIX}${m.id}`;
    extIds.push(extId);

    const data = {
      kickoff: new Date(m.utcDate),
      homeTeam: m.home,
      awayTeam: m.away,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      competition: m.competition,
      venue: m.venue,
      // Mahalliy Premer-liga gerbi ustun, bo'lmasa API logotipi
      homeBadge: badgeFor(badges, m.home) ?? m.homeLogo,
      awayBadge: badgeFor(badges, m.away) ?? m.awayLogo,
    };
    await prisma.match.upsert({
      where: { extId },
      create: { extId, ...data },
      update: data,
    });
  }

  // Eski manbadan qolgan va mavsumdan tushib qolgan yozuvlarni tozalaymiz
  const removed = await prisma.match.deleteMany({ where: { extId: { notIn: extIds } } });

  return {
    section: "o'yinlar",
    ok: true,
    count: matches.length,
    message: `API-Football${removed.count > 0 ? ` · ${removed.count} eski yozuv o'chirildi` : ""}`,
  };
}

/**
 * football-data.org: mavsum o'yinlari (Premer-liga va Chempionlar ligasi).
 * Kubok o'yinlari bepul tarifda yo'q — ular TheSportsDB'dan qo'shiladi.
 */
async function syncMatchesFromFootballData(
  badges: Map<string, string>,
): Promise<SectionResult | null> {
  const matches = await fetchTeamMatches(currentApiSeason(), 0);
  if (!matches || matches.length === 0) return null;

  const extIds: string[] = [];

  for (const m of matches) {
    const extId = `${FD_PREFIX}${m.id}`;
    extIds.push(extId);

    const data = {
      kickoff: m.kickoff,
      homeTeam: m.home,
      awayTeam: m.away,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      competition: m.competition,
      venue: null,
      homeBadge: badgeFor(badges, m.home) ?? m.homeCrest,
      awayBadge: badgeFor(badges, m.away) ?? m.awayCrest,
    };
    await prisma.match.upsert({
      where: { extId },
      create: { extId, ...data },
      update: data,
    });
  }

  // Boshqa manbalardan qolgan yozuvlar (masalan eski API-Football)
  // o'chiriladi — TheSportsDB qo'shimchalari alohida boshqariladi
  const removed = await prisma.match.deleteMany({
    where: { extId: { notIn: extIds, not: { startsWith: SPORTSDB_PREFIX } } },
  });

  const extras = await addSportsDbExtras(badges, matches.map((m) => m.kickoff));

  const notes = [
    extras > 0 ? `${extras} ta kubok o'yini TheSportsDB'dan` : null,
    removed.count > 0 ? `${removed.count} eski yozuv o'chirildi` : null,
  ].filter(Boolean);

  return {
    section: "o'yinlar",
    ok: true,
    count: matches.length + extras,
    message: `football-data.org${notes.length ? ` · ${notes.join(" · ")}` : ""}`,
  };
}

interface MatchRow {
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
}

function exactKickoff(utcDate: string | undefined): Date | null {
  if (!utcDate) return null;
  const d = new Date(utcDate);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** TheSportsDB bergan o'yinlarni baza yozuvi shakliga keltiradi. */
async function sportsDbRows(badges: Map<string, string>): Promise<MatchRow[] | null> {
  const [fixtures, results] = await Promise.all([fetchFixtures(), fetchResults()]);
  if (!fixtures && !results) return null;

  const rows: MatchRow[] = [];

  for (const f of fixtures ?? []) {
    const kickoff = exactKickoff(f.utcDate) ?? parseKickoff(f.date, f.time);
    if (!kickoff) continue;
    rows.push({
      extId: `${SPORTSDB_PREFIX}${f.id}`,
      kickoff,
      homeTeam: f.home,
      awayTeam: f.away,
      homeScore: null,
      awayScore: null,
      competition: f.comp,
      venue: f.venue,
      homeBadge: badgeFor(badges, f.home),
      awayBadge: badgeFor(badges, f.away),
    });
  }

  for (const r of results ?? []) {
    // Aniq vaqt muhim: asosiy manbadagi shu o'yin bilan solishtiriladi
    const kickoff = exactKickoff(r.utcDate) ?? parseKickoff(r.date, "12:00");
    if (!kickoff) continue;
    rows.push({
      extId: `${SPORTSDB_PREFIX}${r.id}`,
      kickoff,
      homeTeam: r.home,
      awayTeam: r.away,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      competition: r.comp,
      venue: null,
      homeBadge: badgeFor(badges, r.home),
      awayBadge: badgeFor(badges, r.away),
    });
  }

  return rows;
}

async function upsertRow(row: MatchRow): Promise<void> {
  const { extId, ...data } = row;
  await prisma.match.upsert({ where: { extId }, create: { extId, ...data }, update: data });
}

/**
 * Asosiy manbada yo'q o'yinlarni (odatda kubok) TheSportsDB'dan qo'shadi.
 * Asosiy manbada bor o'yin takrorlanmaydi; eskirgan TheSportsDB
 * yozuvlari o'chiriladi. Qo'shilgan o'yinlar sonini qaytaradi.
 */
async function addSportsDbExtras(
  badges: Map<string, string>,
  knownKickoffs: Date[],
): Promise<number> {
  const kept: string[] = [];

  try {
    const rows = (await sportsDbRows(badges)) ?? [];
    for (const row of rows) {
      if (overlaps(row.kickoff, knownKickoffs)) continue;
      await upsertRow(row);
      kept.push(row.extId);
    }
  } catch (error) {
    console.error("[sync] TheSportsDB qo'shimchalari:", error);
  }

  await prisma.match.deleteMany({
    where: { extId: { startsWith: SPORTSDB_PREFIX, notIn: kept } },
  });

  return kept.length;
}

async function syncMatches(badges: Map<string, string>): Promise<SectionResult> {
  // Asosiy manba — API-Football: u fixture id beradi, ya'ni saytda
  // har bir o'yin uchun tafsilot sahifasi ochiladi
  const fromApi = await syncMatchesFromApi(badges);
  if (fromApi) return fromApi;

  // Keyin football-data.org — bepul tarifda mavsumning liga o'yinlari
  const fromFd = await syncMatchesFromFootballData(badges);
  if (fromFd) return fromFd;

  // Oxirgi chora — TheSportsDB: bepul kalit faqat eng yaqin va oxirgi
  // o'yinni beradi
  const rows = await sportsDbRows(badges);
  if (!rows) {
    return { section: "o'yinlar", ok: false, count: 0, message: "manba javob bermadi" };
  }

  for (const row of rows) await upsertRow(row);

  // Shu o'yinlarning boshqa manbadagi nusxalari o'chiriladi — aks holda
  // bir o'yin ikki marta chiqadi va eski nusxaning hisobi yangilanmaydi
  if (rows.length > 0) {
    await prisma.match.deleteMany({
      where: {
        extId: { not: { startsWith: SPORTSDB_PREFIX } },
        OR: rows.map((r) => ({
          kickoff: {
            gte: new Date(r.kickoff.getTime() - SAME_MATCH_WINDOW_MS),
            lte: new Date(r.kickoff.getTime() + SAME_MATCH_WINDOW_MS),
          },
        })),
      },
    });
  }

  return {
    section: "o'yinlar",
    ok: true,
    count: rows.length,
    message: "TheSportsDB (zaxira manba)",
  };
}

/* ---------------- Jadval ---------------- */

async function syncStandings(badges: Map<string, string>): Promise<SectionResult> {
  // API-Football va football-data.org to'liq 20 talik jadvalni beradi;
  // ikkalasi ham bo'lmasa TheSportsDB (bepul kalit faqat top 5 ni biladi)
  const data =
    (await fetchLeagueStandings()) ??
    (await fetchFdStandings(0)) ??
    (await fetchStandings());

  if (!data || data.rows.length === 0) {
    return { section: "jadval", ok: false, count: 0, message: "manba javob bermadi" };
  }

  // Eski mavsum yozuvlarini tozalaymiz — faqat joriy ko'rsatiladi
  await prisma.standingRow.deleteMany({ where: { season: { not: data.season } } });

  for (const row of data.rows) {
    const values = {
      pos: row.pos,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      gd: row.gd,
      points: row.points,
      isUnited: row.isUnited ?? false,
      isPreviousSeason: data.isPreviousSeason,
      badge: badgeFor(badges, row.team) ?? row.badge ?? null,
    };
    await prisma.standingRow.upsert({
      where: { season_team: { season: data.season, team: row.team } },
      create: { season: data.season, team: row.team, ...values },
      update: values,
    });
  }

  // Manbalar jamoani turlicha ataydi ("Brighton" / "Brighton & Hove Albion") —
  // shu mavsumning ro'yxatda yo'q qatorlari eski manbadan qolgan, o'chiriladi
  await prisma.standingRow.deleteMany({
    where: { season: data.season, team: { notIn: data.rows.map((r) => r.team) } },
  });

  return {
    section: "jadval",
    ok: true,
    count: data.rows.length,
    message: `${data.season}${data.isPreviousSeason ? " (oldingi mavsum)" : ""}`,
  };
}

/* ---------------- Umumiy yurish ---------------- */

export async function runSync(): Promise<{ ok: boolean; sections: SectionResult[]; logId: number }> {
  const log = await prisma.syncLog.create({ data: {}, select: { id: true } });

  // Gerblar bir marta olinadi va ikkala bo'limga beriladi
  const sections: SectionResult[] = [];
  let badges = new Map<string, string>();

  try {
    const remote = await fetchBadgeMap();
    const local = await localizeBadges(remote);
    badges = local.map;
    sections.push({
      section: "gerblar",
      ok: remote.size > 0,
      count: remote.size,
      message: local.downloaded
        ? `${local.downloaded} tasi yuklandi${local.failed ? `, ${local.failed} tasi yuklanmadi` : ""}`
        : local.failed
          ? `${local.failed} tasi yuklanmadi`
          : "hammasi allaqachon serverda",
    });
  } catch (error) {
    console.error("[sync] gerblar:", error);
    sections.push({
      section: "gerblar",
      ok: false,
      count: 0,
      message: error instanceof Error ? error.message.slice(0, 120) : "noma'lum xato",
    });
  }

  // Konfiguratsiyadagi team ID to'g'riligini API orqali tasdiqlaymiz —
  // kalit bo'lmasa bo'lim shunchaki o'tkazib yuboriladi
  if (hasFootballKey()) {
    try {
      const check = await verifyTeamId();
      sections.push({ section: "team ID", ok: check.ok, count: check.ok ? 1 : 0, message: check.message });
    } catch (error) {
      console.error("[sync] team ID:", error);
      sections.push({ section: "team ID", ok: false, count: 0, message: "tekshirib bo'lmadi" });
    }
  }

  const tasks: (() => Promise<SectionResult>)[] = [
    syncSquad,
    () => syncMatches(badges),
    () => syncStandings(badges),
    async () => {
      const deleted = await pruneVisits();
      return {
        section: "tashriflar",
        ok: true,
        count: deleted,
        message: deleted ? ` ta eski yozuv o'chirildi` : "eski yozuv yo'q",
      };
    },
  ];

  for (const task of tasks) {
    try {
      sections.push(await task());
    } catch (error) {
      console.error("[sync] bo'lim yiqildi:", error);
      sections.push({
        section: task.name || "bo'lim",
        ok: false,
        count: 0,
        message: error instanceof Error ? error.message.slice(0, 150) : "noma'lum xato",
      });
    }
  }

  const ok = sections.every((s) => s.ok);

  await prisma.syncLog.update({
    where: { id: log.id },
    data: { finishedAt: new Date(), ok, details: JSON.stringify(sections) },
  });

  return { ok, sections, logId: log.id };
}
