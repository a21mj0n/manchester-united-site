import { NextResponse } from "next/server";
import { currentApiSeason, selectableSeasons } from "@/config/football";
import { getSeasonMatches } from "@/lib/matches";

/**
 * GET /api/matches?season=2026 — mavsum o'yinlari (JSON).
 * Musobaqa/holat bo'yicha filtrlar klientda qo'llanadi — bitta javob
 * mavsumning hamma o'yinini o'z ichiga oladi.
 */
export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("season");
  const season = param ? Number(param) : currentApiSeason();

  if (!Number.isInteger(season) || !selectableSeasons(8).includes(season)) {
    return NextResponse.json({ error: "season qiymati noto'g'ri" }, { status: 400 });
  }

  const data = await getSeasonMatches(season);
  return NextResponse.json(data);
}
