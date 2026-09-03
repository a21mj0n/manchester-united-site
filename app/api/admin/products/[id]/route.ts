import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseProductForm, uniqueSlug } from "@/lib/shop";
import { deleteUpload, saveUpload } from "@/lib/uploads";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function revalidate(slug: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/shop/${slug}`);
}

/** PATCH /api/admin/products/[id] — tahrirlash (multipart) yoki faqat {active} (JSON). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Mahsulot topilmadi." }, { status: 404 });

  // Faqat sotuv holatini almashtirish
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { active?: unknown } | null;
    if (!body || typeof body.active !== "boolean") {
      return NextResponse.json({ error: "active mantiqiy qiymat bo'lishi kerak." }, { status: 400 });
    }
    const updated = await prisma.product.update({ where: { id }, data: { active: body.active } });
    revalidate(existing.slug);
    return NextResponse.json(updated);
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const parsed = parseProductForm(fd);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let image = existing.image;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file);
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
    await deleteUpload(existing.image);
    image = saved.path;
  } else if (fd.get("removeImage") === "true") {
    await deleteUpload(existing.image);
    image = null;
  }

  try {
    const slug =
      parsed.value.name === existing.name ? existing.slug : await uniqueSlug(parsed.value.name, id);
    const updated = await prisma.product.update({
      where: { id },
      data: { ...parsed.value, slug, image },
    });
    revalidate(existing.slug);
    revalidate(slug);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[admin/products] tahrirlashda xatolik:", error);
    return NextResponse.json({ error: "Saqlab bo'lmadi." }, { status: 500 });
  }
}

/** DELETE /api/admin/products/[id] — buyurtmasi bo'lsa o'chirilmaydi, yashiriladi. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Mahsulot topilmadi." }, { status: 404 });

  if (existing._count.orders > 0) {
    await prisma.product.update({ where: { id }, data: { active: false } });
    revalidate(existing.slug);
    return NextResponse.json({
      hidden: true,
      message: "Bu mahsulotga buyurtmalar bor, shuning uchun o'chirilmadi, sotuvdan olindi.",
    });
  }

  await prisma.product.delete({ where: { id } });
  await deleteUpload(existing.image);
  revalidate(existing.slug);
  return NextResponse.json({ deleted: true });
}
