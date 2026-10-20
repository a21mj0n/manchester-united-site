import { NextResponse } from "next/server";
import { runChannelPosts, sendChannelTest } from "@/lib/channel";

/**
 * POST /api/admin/channel — admin paneldan kanalni boshqarish.
 *   { action: "test" } — sinov xabari
 *   { action: "run" }  — postlarni hozir tekshirib yuborish
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  let action = "";
  try {
    const body = (await request.json()) as { action?: unknown };
    action = typeof body.action === "string" ? body.action : "";
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  if (action === "test") {
    const ok = await sendChannelTest();
    return NextResponse.json(
      ok ? { ok: true } : { ok: false, error: "Yuborilmadi — bot tokeni yoki kanal huquqini tekshiring." },
      { status: ok ? 200 : 502 },
    );
  }

  if (action === "run") {
    return NextResponse.json(await runChannelPosts());
  }

  return NextResponse.json({ error: "Noma'lum amal." }, { status: 400 });
}
