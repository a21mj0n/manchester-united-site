/**
 * Jamoa tarkibi va futbolchi statistikasi — API-Football'dan.
 *
 * fetchSquad ilgari lib/football-api.ts da edi; endi barcha
 * API-Football so'rovlari lib/football/ ostida jamlangan.
 */

import { CACHE, currentApiSeason, MANCHESTER_UNITED_TEAM_ID } from "@/config/football";
import type { Player, Position } from "@/lib/types";
import type {
  ApiPlayerProfile,
  ApiSquadPlayer,
  PlayerCompetitionStats,
  PlayerProfile,
} from "@/types/football";
import { apiGet } from "./client";

const POSITION_MAP: Record<string, { pos: Position; label: string }> = {
  Goalkeeper: { pos: "GK", label: "Darvozabon" },
  Defender: { pos: "DF", label: "Himoyachi" },
  Midfielder: { pos: "MF", label: "Yarim himoyachi" },
  Attacker: { pos: "FW", label: "Hujumchi" },
};

const POSITION_ORDER: Position[] = ["GK", "DF", "MF", "FW"];

/** Joriy tarkib. Xatolikda null — chaqiruvchi demo ma'lumotga tushadi. */
export async function fetchSquad(): Promise<Player[] | null> {
  const rows = await apiGet<{ players?: ApiSquadPlayer[] }>(
    "players/squads",
    { team: MANCHESTER_UNITED_TEAM_ID },
    CACHE.squad,
  );

  const raw = rows?.[0]?.players ?? [];
  if (raw.length === 0) return null;

  const players: Player[] = raw
    .filter((p) => p.position && POSITION_MAP[p.position])
    .map((p) => {
      const mapped = POSITION_MAP[p.position as string];
      return {
        id: p.id,
        apiId: p.id,
        num: p.number ?? 0,
        name: p.name,
        pos: mapped.pos,
        posName: mapped.label,
        age: p.age ?? undefined,
        photo: p.photo ?? undefined,
      };
    });

  // Pozitsiya bo'yicha, keyin raqam bo'yicha tartiblaymiz
  players.sort((a, b) => {
    const byPos = POSITION_ORDER.indexOf(a.pos) - POSITION_ORDER.indexOf(b.pos);
    if (byPos !== 0) return byPos;
    if (a.num === 0) return 1;
    if (b.num === 0) return -1;
    return a.num - b.num;
  });

  return players;
}

function n(value: number | null | undefined): number {
  return value ?? 0;
}

function mapCompetitionStats(s: ApiPlayerProfile["statistics"][number]): PlayerCompetitionStats {
  return {
    competition: s.league.name ?? "Musobaqa",
    competitionLogo: s.league.logo ?? null,
    appearances: n(s.games.appearences),
    lineups: n(s.games.lineups),
    minutes: n(s.games.minutes),
    rating: s.games.rating ? Number(s.games.rating).toFixed(2) : null,
    goals: n(s.goals.total),
    assists: n(s.goals.assists),
    shots: n(s.shots.total),
    shotsOn: n(s.shots.on),
    passes: n(s.passes.total),
    keyPasses: n(s.passes.key),
    passAccuracy: s.passes.accuracy,
    tackles: n(s.tackles.total),
    interceptions: n(s.tackles.interceptions),
    dribblesWon: n(s.dribbles.success),
    duelsWon: n(s.duels.won),
    foulsDrawn: n(s.fouls.drawn),
    foulsCommitted: n(s.fouls.committed),
    yellow: n(s.cards.yellow),
    red: n(s.cards.red) + n(s.cards.yellowred),
    saves: n(s.goals.saves),
    conceded: n(s.goals.conceded),
  };
}

/**
 * Futbolchining mavsum bo'yicha profili va statistikasi
 * (musobaqalarga bo'lingan holda). Topilmasa null.
 */
export async function fetchPlayerProfile(
  playerId: number,
  season: number = currentApiSeason(),
): Promise<PlayerProfile | null> {
  const rows = await apiGet<ApiPlayerProfile>(
    "players",
    { id: playerId, season },
    CACHE.playerStats,
  );

  const profile = rows?.[0];
  if (!profile) return null;

  // Faqat o'yin bo'lgan musobaqalarni ko'rsatamiz
  const competitions = profile.statistics
    .filter((s) => n(s.games.appearences) > 0 || n(s.games.minutes) > 0)
    .map(mapCompetitionStats)
    .sort((a, b) => b.minutes - a.minutes);

  const main = profile.statistics[0];

  return {
    id: profile.player.id,
    name: profile.player.name,
    photo: profile.player.photo ?? null,
    age: profile.player.age,
    nationality: profile.player.nationality,
    height: profile.player.height,
    weight: profile.player.weight,
    birthDate: profile.player.birth.date,
    birthPlace: profile.player.birth.place,
    position: main?.games.position ?? null,
    number: main?.games.number ?? null,
    season,
    competitions,
  };
}

/**
 * Joriy mavsum manbada yopiq bo'lishi mumkin (bepul tarif faqat
 * eski mavsumlarni beradi), shuning uchun ochiq topilgunicha
 * mavsumlar bo'ylab orqaga yuramiz.
 *
 * Yopiq mavsum birinchi urinishdan keyin client'da to'xtatilgan
 * ro'yxatga tushadi — keyingi so'rovlar limitni sarflamaydi.
 */
export async function fetchLatestPlayerProfile(
  playerId: number,
  maxLookback = 4,
): Promise<PlayerProfile | null> {
  const current = currentApiSeason();

  for (let i = 0; i < maxLookback; i++) {
    const profile = await fetchPlayerProfile(playerId, current - i);
    if (profile) return profile;
  }

  return null;
}
