import { prisma } from "../prisma";
import { fetchSquad } from "../football-api";
import { fetchFixtures, fetchResults, fetchStandings } from "../sportsdb";
import { fetchFeed } from "../rss";
import { KEEP_IMPORTED, NEWS_SOURCES, PER_SOURCE_LIMIT } from "./sources";

/**
 * Kunlik sinxronizatsiya: ochiq manbalardan ma'lumot olib bazaga yozadi.
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

/** Akademiya/zaxira o'yinchisini aniqlash chegarasi */
const ACADEMY_MAX_AGE = 20;

/**
 * API "akademiya" degan maydon bermaydi, shuning uchun ikki belgidan
 * foydalanamiz:
 *   1. Yosh — 20 va undan kichik
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

  for (const p of players) {
    const data = {
      num: p.num,
      name: p.name,
      pos: p.pos,
      posName: p.posName,
      age: p.age ?? null,
      photo: p.photo ?? null,
      country: p.country ?? null,
      isAcademy: academy.has(p.id),
    };
    await prisma.player.upsert({
      where: { apiId: p.id },
      create: { apiId: p.id, ...data },
      update: data,
    });
  }

  // Jamoadan ketganlarni olib tashlaymiz
  const removed = await prisma.player.deleteMany({ where: { apiId: { notIn: apiIds } } });

  const parts = [`${players.length - academy.size} asosiy, ${academy.size} akademiya`];
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

async function syncMatches(): Promise<SectionResult> {
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
    };
    await prisma.match.upsert({
      where: { extId: String(f.id) },
      create: { extId: String(f.id), ...data },
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
    };
    await prisma.match.upsert({
      where: { extId: String(r.id) },
      create: { extId: String(r.id), ...data },
      update: data,
    });
    saved++;
  }

  return { section: "o'yinlar", ok: true, count: saved, message: "" };
}

/* ---------------- Jadval ---------------- */

async function syncStandings(): Promise<SectionResult> {
  const data = await fetchStandings();

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

/* ---------------- Yangiliklar ---------------- */

async function syncNews(): Promise<SectionResult> {
  let added = 0;
  const failed: string[] = [];

  for (const source of NEWS_SOURCES) {
    try {
      const items = (await fetchFeed(source.url)).slice(0, PER_SOURCE_LIMIT);

      for (const item of items) {
        const existing = await prisma.newsPost.findUnique({
          where: { externalId: item.guid },
          select: { id: true },
        });
        if (existing) continue;

        await prisma.newsPost.create({
          data: {
            title: item.title.slice(0, 200),
            excerpt: item.description.slice(0, 300),
            tag: source.name,
            tagColor: "default",
            image: (added % 4) + 1,
            meta: "",
            featured: false,
            published: true,
            sourceName: source.name,
            sourceUrl: item.link,
            externalId: item.guid,
            publishedAt: item.publishedAt,
          },
        });
        added++;
      }
    } catch (error) {
      console.error(`[sync] ${source.name}:`, error);
      failed.push(source.name);
    }
  }

  // Eskilarini olib tashlaymiz — faqat import qilinganlar,
  // qo'lda yozilgan yangiliklarga tegilmaydi
  const imported = await prisma.newsPost.findMany({
    where: { externalId: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
    skip: KEEP_IMPORTED,
  });
  if (imported.length > 0) {
    await prisma.newsPost.deleteMany({ where: { id: { in: imported.map((p) => p.id) } } });
  }

  return {
    section: "yangiliklar",
    ok: failed.length < NEWS_SOURCES.length,
    count: added,
    message: failed.length ? `ishlamadi: ${failed.join(", ")}` : "",
  };
}

/* ---------------- Umumiy yurish ---------------- */

export async function runSync(): Promise<{ ok: boolean; sections: SectionResult[]; logId: number }> {
  const log = await prisma.syncLog.create({ data: {}, select: { id: true } });

  const tasks: (() => Promise<SectionResult>)[] = [
    syncSquad,
    syncMatches,
    syncStandings,
    syncNews,
  ];

  const sections: SectionResult[] = [];

  for (const task of tasks) {
    try {
      sections.push(await task());
    } catch (error) {
      console.error("[sync] bo'lim yiqildi:", error);
      sections.push({
        section: task.name,
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
