import { NextResponse } from "next/server";

/** GET /api/health — monitoring va deploy tekshiruvi uchun. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
