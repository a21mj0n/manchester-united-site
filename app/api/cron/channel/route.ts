import { NextResponse } from "next/server";
import { runChannelPosts } from "@/lib/channel";

/**
 * POST /api/cron/channel — Telegram kanal postlari (o'yin kuni, natija).
 *
 * Serverdagi systemd timer har 30 daqiqada chaqiradi
 * (deploy/red-devils-channel.timer). CRON_SECRET bilan himoyalangan.
 */
export const maxDuration = 60;

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

  const result = await runChannelPosts();
  return NextResponse.json(result);
}
