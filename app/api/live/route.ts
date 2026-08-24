import { NextResponse } from "next/server";
import { getLiveMatch } from "@/lib/live";

/**
 * GET /api/live — hozir borayotgan Manchester United o'yini yoki null.
 * Klient shu manzilni so'rab turadi; API-Football'ga esa server
 * keshlangan holda (2 daqiqa) murojaat qiladi — limit tejaladi.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const match = await getLiveMatch();
  return NextResponse.json({ match });
}
