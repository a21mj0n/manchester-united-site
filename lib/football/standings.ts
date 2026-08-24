/**
 * Premer-liga turnir jadvali — API-Football'dan.
 *
 * Natija lib/sportsdb.ts dagi StandingsResult bilan bir xil shaklda
 * qaytariladi, shunda mavjud Standings komponenti o'zgarishsiz ishlaydi.
 */

import {
  CACHE,
  currentApiSeason,
  MANCHESTER_UNITED_TEAM_ID,
  PREMIER_LEAGUE_ID,
} from "@/config/football";
import type { Standing } from "@/lib/types";
import type { StandingsResult } from "@/lib/sportsdb";
import { apiGet } from "./client";

interface ApiStandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number };
}

interface ApiStandingsResponse {
  league: {
    id: number;
    season: number;
    standings: ApiStandingRow[][];
  };
}

/** To'liq Premer-liga jadvali. Xatolikda null. */
export async function fetchLeagueStandings(
  season: number = currentApiSeason(),
): Promise<StandingsResult | null> {
  const rows = await apiGet<ApiStandingsResponse>(
    "standings",
    { league: PREMIER_LEAGUE_ID, season },
    CACHE.standings,
  );

  const table = rows?.[0]?.league?.standings?.[0];
  if (!table || table.length === 0) return null;

  const standings: Standing[] = table.map((r) => ({
    pos: r.rank,
    team: r.team.name,
    played: r.all.played,
    won: r.all.win,
    drawn: r.all.draw,
    lost: r.all.lose,
    gd: r.goalsDiff > 0 ? `+${r.goalsDiff}` : String(r.goalsDiff),
    points: r.points,
    isUnited: r.team.id === MANCHESTER_UNITED_TEAM_ID,
    badge: r.team.logo ?? null,
  }));

  return {
    rows: standings,
    season: `${season}-${season + 1}`,
    isPreviousSeason: false,
  };
}
