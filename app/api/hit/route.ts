import { NextResponse } from "next/server";

import { recordVisit } from "@/lib/visits";

/**
 * POST /api/hit — brauzerdan keladigan tashrif signali.
 *
 * Body: {"path": "/matches"}. Javob doim 204 — hisoblagich hech qachon
 * foydalanuvchiga xato ko'rsatmasligi kerak.
 */
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "0.0.0.0";
}

export async function POST(request: Request) {
  let path = "";
  try {
    const text = await request.text();
    const body = JSON.parse(text) as { path?: unknown };
    path = typeof body.path === "string" ? body.path : "";
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await recordVisit({
      path,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? "",
    });
  } catch (error) {
    console.error("[hit] yozib bo'lmadi:", error);
  }

  return new NextResponse(null, { status: 204 });
}
