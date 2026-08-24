/**
 * Jamoa ma'lumotlari — asosan MANCHESTER_UNITED_TEAM_ID (33) ni
 * tekshirish uchun. Sinxronizatsiya paytida bir marta chaqiriladi:
 * ID noto'g'ri bo'lsa log'da ko'rinadi.
 */

import { MANCHESTER_UNITED_TEAM_ID } from "@/config/football";
import { apiGet } from "./client";

interface ApiTeamInfo {
  team: { id: number; name: string; country: string; founded: number | null; logo: string };
  venue: { name: string | null; city: string | null };
}

export interface TeamVerification {
  ok: boolean;
  name: string | null;
  message: string;
}

/**
 * Konfiguratsiyadagi team ID haqiqatan Manchester United ekanini
 * API orqali tasdiqlaydi.
 */
export async function verifyTeamId(): Promise<TeamVerification> {
  const rows = await apiGet<ApiTeamInfo>(
    "teams",
    { id: MANCHESTER_UNITED_TEAM_ID },
    86400,
  );

  const team = rows?.[0]?.team;
  if (!team) {
    return { ok: false, name: null, message: "API javob bermadi yoki kalit ishlamayapti" };
  }

  const ok = team.name === "Manchester United" && team.country === "England";
  return {
    ok,
    name: team.name,
    message: ok
      ? `ID ${MANCHESTER_UNITED_TEAM_ID} = ${team.name} (${team.country}, ${team.founded ?? "—"})`
      : `Diqqat: ID ${MANCHESTER_UNITED_TEAM_ID} boshqa jamoaga tegishli — ${team.name}`,
  };
}
