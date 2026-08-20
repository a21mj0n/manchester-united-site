import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync/run";

/** POST /api/admin/sync — admin paneldan qo'lda ishga tushirish. */
export const maxDuration = 120;

export async function POST() {
  const result = await runSync();
  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}
