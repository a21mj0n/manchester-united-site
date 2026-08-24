import { apiFixtureId } from "./match-id";
import { prisma } from "./prisma";
import type { Fixture, Player, Result, Standing } from "./types";
import type { StandingsResult } from "./sportsdb";

/**
 * Sayt ma'lumotni bazadan o'qiydi — uni kunlik sinxronizatsiya to'ldiradi.
 * Baza bo'sh bo'lsa (masalan hali birinchi sinxronizatsiya bo'lmagan)
 * null qaytariladi va chaqiruvchi jonli API ga, undan keyin demo
 * ma'lumotga tushadi.
 */

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];

function formatDate(d: Date) {
  const local = new Date(d.getTime() + TASHKENT_OFFSET_MS);
  return {
    date: `${local.getUTCDate()}-${MONTHS[local.getUTCMonth()]}`,
    time: `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`,
  };
}

export async function readSquad(): Promise<Player[] | null> {
  const rows = await prisma.player.findMany({ orderBy: [{ pos: "asc" }, { num: "asc" }] });
  if (rows.length === 0) return null;

  const ORDER = ["GK", "DF", "MF", "FW"];
  return rows
    .map((r) => ({
      id: r.id,
      apiId: r.apiId ?? undefined,
      num: r.num,
      name: r.name,
      pos: r.pos as Player["pos"],
      posName: r.posName,
      age: r.age ?? undefined,
      photo: r.photo ?? undefined,
      country: r.country ?? undefined,
      isAcademy: r.isAcademy,
    }))
    .sort((a, b) => {
      const byPos = ORDER.indexOf(a.pos) - ORDER.indexOf(b.pos);
      return byPos !== 0 ? byPos : a.num - b.num;
    });
}

export async function readFixtures(): Promise<Fixture[] | null> {
  const rows = await prisma.match.findMany({
    where: { homeScore: null, kickoff: { gte: new Date(Date.now() - 3 * 3600 * 1000) } },
    orderBy: { kickoff: "asc" },
    take: 5,
  });
  if (rows.length === 0) return null;

  return rows.map((r) => {
    const { date, time } = formatDate(r.kickoff);
    return {
      id: r.id,
      fixtureId: apiFixtureId(r.extId) ?? undefined,
      date,
      time,
      home: r.homeTeam,
      away: r.awayTeam,
      comp: r.competition,
      venue: r.venue ?? "",
      homeBadge: r.homeBadge,
      awayBadge: r.awayBadge,
    };
  });
}

export async function readResults(): Promise<Result[] | null> {
  const rows = await prisma.match.findMany({
    where: { homeScore: { not: null } },
    orderBy: { kickoff: "desc" },
    take: 5,
  });
  if (rows.length === 0) return null;

  return rows.map((r) => ({
    id: r.id,
    fixtureId: apiFixtureId(r.extId) ?? undefined,
    date: formatDate(r.kickoff).date,
    home: r.homeTeam,
    away: r.awayTeam,
    homeScore: r.homeScore ?? 0,
    awayScore: r.awayScore ?? 0,
    comp: r.competition,
    homeBadge: r.homeBadge,
    awayBadge: r.awayBadge,
  }));
}

export async function readStandings(): Promise<StandingsResult | null> {
  const rows = await prisma.standingRow.findMany({ orderBy: { pos: "asc" } });
  if (rows.length === 0) return null;

  const standings: Standing[] = rows.map((r) => ({
    pos: r.pos,
    team: r.team,
    played: r.played,
    won: r.won,
    drawn: r.drawn,
    lost: r.lost,
    gd: r.gd,
    points: r.points,
    isUnited: r.isUnited,
    badge: r.badge,
  }));

  return {
    rows: standings,
    season: rows[0].season,
    isPreviousSeason: rows[0].isPreviousSeason,
  };
}

/** Oxirgi o'ynalgan o'yin — bosh sahifadagi natija kartasi uchun. */
export async function readLastMatch() {
  return prisma.match.findFirst({
    where: { homeScore: { not: null } },
    orderBy: { kickoff: "desc" },
  });
}

/** Eng yaqin kelgusi o'yin — sanoq uchun. */
export async function readNextKickoff(): Promise<{
  kickoff: Date;
  home: string;
  away: string;
  competition: string;
  venue: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
} | null> {
  const match = await prisma.match.findFirst({
    where: { kickoff: { gte: new Date(Date.now() - 3 * 3600 * 1000) } },
    orderBy: { kickoff: "asc" },
  });
  if (!match) return null;

  return {
    kickoff: match.kickoff,
    home: match.homeTeam,
    away: match.awayTeam,
    competition: match.competition,
    venue: match.venue,
    homeBadge: match.homeBadge,
    awayBadge: match.awayBadge,
  };
}
