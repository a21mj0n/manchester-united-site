import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePlayerInput } from "@/lib/squad-validate";

/**
 * POST /api/admin/squad — o'yinchini qo'lda qo'shish.
 *
 * Manba tarkibni chala berganda kerak bo'ladi: bunday yozuvda apiId
 * bo'lmaydi va kunlik sinxronizatsiya uni o'chirmaydi.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const parsed = parsePlayerInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const created = await prisma.player.create({
      data: {
        ...parsed.value,
        manual: true,
        academyOverride: parsed.value.isAcademy,
      },
      select: { id: true },
    });
    revalidatePath("/");
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[admin/squad] qo'shishda xatolik:", error);
    return NextResponse.json({ error: "Saqlab bo'lmadi." }, { status: 500 });
  }
}
