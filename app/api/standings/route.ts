import { NextResponse } from "next/server";
import { getStandings } from "@/lib/queries";

/** GET /api/standings — turnir jadvali (JSON). */
export async function GET() {
  const standings = await getStandings();
  return NextResponse.json({ standings });
}
