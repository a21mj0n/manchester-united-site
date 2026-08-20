import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePlayerInput } from "@/lib/squad-validate";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * PATCH /api/admin/squad/[id]
 *   { isAcademy } — guruhni almashtirish (sinxronizatsiya buzmaydi)
 *   to'liq ma'lumot — qo'lda qo'shilgan o'yinchini tahrirlash
 */
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

  const isGroupOnly =
    body !== null &&
    typeof body === "object" &&
    Object.keys(body).length === 1 &&
    "isAcademy" in body;

  if (isGroupOnly) {
    const isAcademy = (body as { isAcademy: unknown }).isAcademy;
    if (typeof isAcademy !== "boolean") {
      return NextResponse.json({ error: "isAcademy mantiqiy qiymat bo'lishi kerak." }, { status: 400 });
    }
    try {
      const updated = await prisma.player.update({
        where: { id },
        // academyOverride — admin qarori, sinxronizatsiya unga tegmaydi
        data: { isAcademy, academyOverride: isAcademy },
        select: { id: true, isAcademy: true },
      });
      revalidatePath("/");
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "O'yinchi topilmadi." }, { status: 404 });
    }
  }

  const parsed = parsePlayerInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const updated = await prisma.player.update({
      where: { id },
      data: { ...parsed.value, academyOverride: parsed.value.isAcademy },
      select: { id: true },
    });
    revalidatePath("/");
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "O'yinchi topilmadi." }, { status: 404 });
  }
}

/** DELETE — faqat qo'lda qo'shilgan o'yinchini o'chirish mumkin. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });

  const player = await prisma.player.findUnique({ where: { id }, select: { manual: true } });
  if (!player) return NextResponse.json({ error: "O'yinchi topilmadi." }, { status: 404 });

  if (!player.manual) {
    return NextResponse.json(
      { error: "Bu o'yinchi manbadan keladi — o'chirsangiz ertaga qaytadi. Guruhini o'zgartiring." },
      { status: 400 },
    );
  }

  await prisma.player.delete({ where: { id } });
  revalidatePath("/");
  return NextResponse.json({ id });
}
