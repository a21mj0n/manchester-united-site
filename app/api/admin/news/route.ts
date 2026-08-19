import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createNews } from "@/lib/news";
import { parseNewsInput } from "@/lib/news-validate";

/** POST /api/admin/news — yangi yangilik qo'shish. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const parsed = parseNewsInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const created = await createNews(parsed.value);
    // Bosh sahifa keshlangan — yangilik darhol ko'rinishi uchun yangilaymiz
    revalidatePath("/");
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[admin/news] qo'shishda xatolik:", error);
    return NextResponse.json({ error: "Saqlab bo'lmadi." }, { status: 500 });
  }
}
