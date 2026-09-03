import { prisma } from "../prisma";
import { fetchSquad } from "../football/players";
import { fetchFixtures, fetchResults, fetchStandings } from "../sportsdb";
import { badgeFor, fetchBadgeMap, localizeBadges } from "../badges";
import { hasFootballKey } from "../football/client";
import { fetchLeagueStandings } from "../football/standings";
import { fetchSeasonFixtures } from "../football/fixtures";
import { verifyTeamId } from "../football/teams";
import { pruneVisits } from "../visits";

/**
 * Kunlik sinxronizatsiya: ochiq manbalardan ma'lumot olib bazaga yozadi.
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

async function syncSquad(): Promise<SectionResult> {
  const players = await fetchSquad();

  if (!players || players.length === 0) {
    return { section: "tarkib", ok: false, count: 0, message: "API tarkibni bermadi" };
  }

  const apiIds = players.map((p) => p.id);
  const academy = markAcademy(players);

  // Admin qo'lda belgilagan guruhlar — ularni buzmaymiz
  const overrides = new Map<number, boolean>();
  const existing = await prisma.player.findMany({
    where: { apiId: { in: apiIds }, academyOverride: { not: null } },
    select: { apiId: true, academyOverride: true },
  });
  for (const row of existing) {
    if (row.apiId !== null && row.academyOverride !== null) {
      overrides.set(row.apiId, row.academyOverride);
    }
  }

  for (const p of players) {
    const data = {
      num: p.num,
      name: p.name,
      pos: p.pos,
      posName: p.posName,
      age: p.age ?? null,
      photo: p.photo ?? null,
      country: p.country ?? null,
      isAcademy: overrides.get(p.id) ?? academy.has(p.id),
    };
    await prisma.player.upsert({
      where: { apiId: p.id },
      create: { apiId: p.id, ...data },
      update: data,
    });
  }

  // Jamoadan ketganlarni olib tashlaymiz.
  // Qo'lda qo'shilganlarga tegilmaydi — manba ularni bilmaydi.
  const removed = await prisma.player.deleteMany({
    where: { manual: false, apiId: { notIn: apiIds } },
  });

  const manual = await prisma.player.count({ where: { manual: true } });
  const parts = [`${players.length - academy.size} asosiy, ${academy.size} akademiya`];
  if (manual > 0) parts.push(`${manual} tasi qo'lda qo'shilgan`);
  if (removed.count > 0) parts.push(`${removed.count} tasi ro'yxatdan chiqdi`);

  return {
    section: "tarkib",
    ok: true,
    count: players.length,
    message: parts.join(" · "),
  };
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
const SPORTSDB_PREFIX = "sdb:";

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

async function syncMatches(badges: Map<string, string>): Promise<SectionResult> {
  // Asosiy manba — API-Football: u fixture id beradi, ya'ni saytda
  // har bir o'yin uchun tafsilot sahifasi ochiladi
  const fromApi = await syncMatchesFromApi(badges);
  if (fromApi) return fromApi;

  const [fixtures, results] = await Promise.all([fetchFixtures(), fetchResults()]);

  if (!fixtures && !results) {
    return { section: "o'yinlar", ok: false, count: 0, message: "manba javob bermadi" };
  }

  let saved = 0;

  for (const f of fixtures ?? []) {
    const kickoff = parseKickoff(f.date, f.time);
    if (!kickoff) continue;

    const data = {
      kickoff,
      homeTeam: f.home,
      awayTeam: f.away,
      homeScore: null,
      awayScore: null,
      competition: f.comp,
      venue: f.venue,
      homeBadge: badgeFor(badges, f.home),
      awayBadge: badgeFor(badges, f.away),
    };
    const extId = `${SPORTSDB_PREFIX}${f.id}`;
    await prisma.match.upsert({
      where: { extId },
      create: { extId, ...data },
      update: data,
    });
    saved++;
  }

  for (const r of results ?? []) {
    const kickoff = parseKickoff(r.date, "12:00");
    if (!kickoff) continue;

    const data = {
      kickoff,
      homeTeam: r.home,
      awayTeam: r.away,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      competition: r.comp,
      venue: null,
      homeBadge: badgeFor(badges, r.home),
      awayBadge: badgeFor(badges, r.away),
    };
    const extId = `${SPORTSDB_PREFIX}${r.id}`;
    await prisma.match.upsert({
      where: { extId },
      create: { extId, ...data },
      update: data,
    });
    saved++;
  }

  return {
    section: "o'yinlar",
    ok: true,
    count: saved,
    message: "TheSportsDB (zaxira manba)",
  };
}

/* ---------------- Jadval ---------------- */

async function syncStandings(badges: Map<string, string>): Promise<SectionResult> {
  // API-Football to'liq 20 talik jadvalni beradi; kalit yo'q yoki tarif
  // yopiq bo'lsa TheSportsDB ga tushamiz (u faqat yuqori o'rinlarni biladi)
  const data = (await fetchLeagueStandings()) ?? (await fetchStandings());

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
