import { NextResponse } from "next/server";
import { getSquad } from "@/lib/queries";
import type { Position } from "@/lib/types";

const POSITIONS: Position[] = ["GK", "DF", "MF", "FW"];

/** GET /api/squad?pos=FW — jamoa tarkibi, ixtiyoriy pozitsiya filtri bilan. */
export async function GET(request: Request) {
  const pos = new URL(request.url).searchParams.get("pos");
  const squad = await getSquad();

  if (pos && !POSITIONS.includes(pos as Position)) {
    return NextResponse.json(
      { error: `pos qiymati quyidagilardan biri bo'lishi kerak: ${POSITIONS.join(", ")}` },
      { status: 400 },
    );
  }

  return NextResponse.json({
    players: pos ? squad.filter((p) => p.pos === pos) : squad,
  });
}
