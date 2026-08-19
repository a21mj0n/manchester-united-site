import { NextResponse, type NextRequest } from "next/server";
import { sessionCookie, verifySessionToken } from "@/lib/auth";

/** /admin va /api/admin ni himoyalaydi. */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(sessionCookie.name)?.value;
  const authorized = await verifySessionToken(token);

  if (authorized) return NextResponse.next();

  // API uchun JSON, sahifalar uchun login'ga yo'naltirish
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
