import { NextResponse } from "next/server";
import { sendNewsToChannel } from "@/lib/channel";

/** POST /api/admin/news/[id]/channel — yangilikni Telegram kanalga yuborish. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });
  }

  const result = await sendNewsToChannel(id);
  if (!result.ok) {
    const status = result.error.includes("topilmadi") ? 404 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
