import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

/**
 * POST /api/auth/login — admin paneliga kirish.
 *
 * Oddiy brute-force himoyasi: bitta IP uchun 5 daqiqada 10 urinish.
 * Xotirada saqlanadi — bitta server uchun yetarli.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || record.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. 5 daqiqadan so'ng qayta urinib ko'ring." },
      { status: 429 },
    );
  }

  let password: string | undefined;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) {
    console.error("[login] ADMIN_PASSWORD_HASH o'rnatilmagan");
    return NextResponse.json(
      { error: "Server sozlanmagan. Administratorga murojaat qiling." },
      { status: 500 },
    );
  }

  if (!password || !(await verifyPassword(password, stored))) {
    return NextResponse.json({ error: "Parol noto'g'ri." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });
  return response;
}
