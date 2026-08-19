import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteNews, updateNews } from "@/lib/news";
import { parseNewsInput } from "@/lib/news-validate";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** PATCH /api/admin/news/[id] — tahrirlash yoki nashr holatini o'zgartirish. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  // Faqat nashr holatini almashtirish
  if (body && typeof body === "object" && Object.keys(body).length === 1 && "published" in body) {
    const published = (body as { published: unknown }).published;
    if (typeof published !== "boolean") {
      return NextResponse.json({ error: "published mantiqiy qiymat bo'lishi kerak." }, { status: 400 });
    }
    try {
      const updated = await updateNews(id, { published });
      revalidatePath("/");
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Yangilik topilmadi." }, { status: 404 });
    }
  }

  const parsed = parseNewsInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const updated = await updateNews(id, parsed.value);
    revalidatePath("/");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[admin/news] tahrirlashda xatolik:", error);
    return NextResponse.json({ error: "Yangilik topilmadi." }, { status: 404 });
  }
}

/** DELETE /api/admin/news/[id] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });

  try {
    const deleted = await deleteNews(id);
    revalidatePath("/");
    return NextResponse.json(deleted);
  } catch {
    return NextResponse.json({ error: "Yangilik topilmadi." }, { status: 404 });
  }
}
