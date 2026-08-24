import { NextResponse } from "next/server";
import { fetchMatchDetails } from "@/lib/football/fixtures";

/** GET /api/matches/:id — o'yin tafsilotlari (events, lineups, statistics). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fixtureId = Number(id);

  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: "id noto'g'ri" }, { status: 400 });
  }

  const details = await fetchMatchDetails(fixtureId);
  if (!details) {
    return NextResponse.json(
      { error: "O'yin topilmadi yoki manba javob bermadi" },
      { status: 404 },
    );
  }

  return NextResponse.json(details);
}
