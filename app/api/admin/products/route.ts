import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseProductForm, uniqueSlug } from "@/lib/shop";
import { saveUpload } from "@/lib/uploads";

/** POST /api/admin/products — yangi mahsulot (multipart: maydonlar + image). */
export async function POST(request: Request) {
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const parsed = parseProductForm(fd);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let image: string | null = null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file);
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
    image = saved.path;
  }

  try {
    const slug = await uniqueSlug(parsed.value.name);
    const created = await prisma.product.create({ data: { ...parsed.value, slug, image } });
    revalidatePath("/");
    revalidatePath("/shop");
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[admin/products] qo'shishda xatolik:", error);
    return NextResponse.json({ error: "Saqlab bo'lmadi." }, { status: 500 });
  }
}
