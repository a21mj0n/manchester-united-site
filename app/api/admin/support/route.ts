import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getDonateSettings, normalizeDonate, setDonateSettings } from "@/lib/donate";

/** GET /api/admin/support — joriy donat sozlamalari. */
export async function GET() {
  return NextResponse.json(await getDonateSettings());
}

function checkUrl(value: string, name: string): string | null {
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return `${name} havolasi noto'g'ri.`;
  }
  if (parsed.protocol !== "https:") return `${name} havolasi https bilan boshlanishi kerak.`;
  return null;
}

/** PUT /api/admin/support — sozlamalarni yangilash. */
export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const s = normalizeDonate(body);

  const error =
    checkUrl(s.paymeUrl, "Payme") ??
    checkUrl(s.clickUrl, "Click") ??
    checkUrl(s.telegramUrl, "Telegram");
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (s.telegramUrl && !/^https:\/\/(t\.me|telegram\.me)\//i.test(s.telegramUrl)) {
    return NextResponse.json(
      { error: "Telegram havolasi t.me bilan boshlanishi kerak." },
      { status: 400 },
    );
  }

  const cardDigits = s.cardNumber.replace(/\D/g, "");
  if (s.cardNumber && cardDigits.length !== 16) {
    return NextResponse.json({ error: "Karta raqami 16 ta raqamdan iborat bo'lishi kerak." }, { status: 400 });
  }
  s.cardNumber = cardDigits;

  if (s.goal > 1_000_000_000 || s.collected > 1_000_000_000) {
    return NextResponse.json({ error: "Summa juda katta." }, { status: 400 });
  }

  try {
    await setDonateSettings(s);
    revalidatePath("/support");
    return NextResponse.json(s);
  } catch (err) {
    console.error("[admin/support] saqlashda xatolik:", err);
    return NextResponse.json({ error: "Saqlab bo'lmadi." }, { status: 500 });
  }
}
