/**
 * API-Football (v3.football.api-sports.io) — jamoa tarkibi uchun.
 *
 * MUHIM: bepul tarifda ko'p narsa yopiq —
 *   · joriy mavsum jadvali va o'yinlari (faqat 2022-2024 mavsumlari)
 *   · next/last parametrlari
 *   · sana bo'yicha so'rov (faqat bugundan +2 kungacha)
 * Shuning uchun o'yinlar va turnir jadvali TheSportsDB dan olinadi
 * (lib/sportsdb.ts), bu yerdan esa faqat tarkib olinadi — u ishlaydi
 * va haqiqiy joriy ro'yxatni, rasmlari bilan beradi.
 *
 * FOOTBALL_API_KEY o'rnatilmagan bo'lsa demo tarkibga tushiladi.
 */

import type { Player, Position } from "./types";

const BASE = "https://v3.football.api-sports.io";
const MANCHESTER_UNITED = 33;

/** Tarkib kamdan-kam o'zgaradi — kuniga bir marta so'raymiz (limit 100/kun). */
const REVALIDATE_SECONDS = 86400;
const TIMEOUT_MS = 8000;

interface RawPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

const POSITION_MAP: Record<string, { pos: Position; label: string }> = {
  Goalkeeper: { pos: "GK", label: "Darvozabon" },
  Defender: { pos: "DF", label: "Himoyachi" },
  Midfielder: { pos: "MF", label: "Yarim himoyachi" },
  Attacker: { pos: "FW", label: "Hujumchi" },
};

const POSITION_ORDER: Position[] = ["GK", "DF", "MF", "FW"];

/** Joriy tarkib. Xatolikda null — chaqiruvchi demo ma'lumotga tushadi. */
export async function fetchSquad(): Promise<Player[] | null> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch(`${BASE}/players/squads?team=${MANCHESTER_UNITED}`, {
      headers: { "x-apisports-key": key },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("[football-api] javob:", response.status);
      return null;
    }

    const data = (await response.json()) as {
      errors?: unknown;
      response?: { players?: RawPlayer[] }[];
    };

    // API xatolarni 200 bilan ham qaytaradi
    const errors = data.errors;
    if (errors && typeof errors === "object" && Object.keys(errors).length > 0) {
      console.error("[football-api] xato:", JSON.stringify(errors).slice(0, 200));
      return null;
    }

    const raw = data.response?.[0]?.players ?? [];
    if (raw.length === 0) return null;

    const players: Player[] = raw
      .filter((p) => p.position && POSITION_MAP[p.position])
      .map((p) => {
        const mapped = POSITION_MAP[p.position as string];
        return {
          id: p.id,
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
  } catch (error) {
    console.error("[football-api] xatolik:", error);
    return null;
  }
}
