import { NextResponse } from "next/server";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { sendCustomPost } from "@/lib/channel";
import type { TelegramPhoto } from "@/lib/telegram";
import { contentTypeForExt, detectExt } from "@/lib/uploads";

/**
 * POST /api/channel/post — kanalga erkin post (matn + ixtiyoriy rasm).
 *
 * Ikki xil kirish:
 *   - admin panel: sessiya cookie'si (brauzerdan, ChannelPanel formasi)
 *   - tashqi vosita: `Authorization: Bearer <CRON_SECRET>` — tasdiqlangan
 *     postni skript yoki yordamchi orqali joylash uchun
 *
 * Tana: multipart (text, html=1, image) yoki JSON { text, html }.
 * /api/admin ostida emas, chunki middleware faqat cookie'ni tekshiradi.
 */
export const maxDuration = 60;

/** Telegram sendPhoto 10 MB gacha qabul qiladi; biz 5 MB bilan cheklaymiz */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function authorized(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (secret && header === `Bearer ${secret}`) return true;

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${sessionCookie.name}=`));
  return verifySessionToken(cookie?.slice(sessionCookie.name.length + 1));
}

function truthy(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && ["1", "true", "on", "yes"].includes(value.toLowerCase());
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
  }

  let text = "";
  let html = false;
  let image: TelegramPhoto | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData();
      text = typeof fd.get("text") === "string" ? (fd.get("text") as string) : "";
      html = truthy(fd.get("html"));

      const file = fd.get("image");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json({ error: "Rasm 5 MB dan katta bo'lmasin." }, { status: 400 });
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const ext = detectExt(bytes);
        if (!ext) {
          return NextResponse.json(
            { error: "Faqat JPG, PNG yoki WebP rasm bo'lishi mumkin." },
            { status: 400 },
          );
        }
        image = { bytes, name: `post.${ext}`, type: contentTypeForExt(ext) };
      }
    } else {
      const body = (await request.json()) as { text?: unknown; html?: unknown };
      text = typeof body.text === "string" ? body.text : "";
      html = body.html === true;
    }
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const result = await sendCustomPost({ text, html, image });
  if (!result.ok) {
    const status = result.error.includes("sozlanmagan") ? 503 : result.error.includes("Telegram") ? 502 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, key: result.key });
}
