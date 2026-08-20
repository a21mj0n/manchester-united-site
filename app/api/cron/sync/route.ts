import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync/run";

/**
 * POST /api/cron/sync — kunlik sinxronizatsiya.
 *
 * Serverdagi systemd timer shu manzilni chaqiradi.
 * CRON_SECRET bilan himoyalangan (middleware bu yo'lni tekshirmaydi,
 * chunki u admin sessiyasiga emas, sirli kalitga tayanadi).
 */
export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron] CRON_SECRET o'rnatilmagan");
    return NextResponse.json({ error: "Server sozlanmagan." }, { status: 500 });
  }

  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
  }

  const started = Date.now();
  const result = await runSync();

  return NextResponse.json(
    {
      ok: result.ok,
      davomiyligi: `${Math.round((Date.now() - started) / 1000)}s`,
      sections: result.sections,
    },
    { status: result.ok ? 200 : 207 },
  );
}
