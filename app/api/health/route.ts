import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/health — monitoring va deploy tekshiruvi uchun. */
export async function GET() {
  let database = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("[/api/health] baza javob bermadi:", error);
    database = "error";
  }

  const body = {
    status: database === "ok" ? "ok" : "degraded",
    database,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: database === "ok" ? 200 : 503 });
}
