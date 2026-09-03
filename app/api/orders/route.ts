import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseOrderInput, parseSizes } from "@/lib/shop";
import { buildOrderMessage, sendTelegramMessage } from "@/lib/telegram";

/** POST /api/orders — do'kondan buyurtma. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const parsed = parseOrderInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Bu mahsulot hozir sotuvda emas." }, { status: 404 });
  }

  const sizes = parseSizes(product.sizes);
  if (sizes.length > 0 && !sizes.includes(input.size)) {
    return NextResponse.json({ error: "O'lchamni tanlang." }, { status: 400 });
  }

  try {
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        productName: product.name,
        price: product.price,
        size: sizes.length ? input.size : "",
        qty: input.qty,
        name: input.name,
        contact: input.contact,
        city: input.city,
        note: input.note,
      },
      select: { id: true },
    });

    await sendTelegramMessage(
      buildOrderMessage({
        id: order.id,
        productName: product.name,
        price: product.price,
        size: sizes.length ? input.size : "",
        qty: input.qty,
        name: input.name,
        contact: input.contact,
        city: input.city,
        note: input.note,
      }),
    );

    return NextResponse.json(
      {
        id: order.id,
        message: `Rahmat, ${input.name}! Buyurtma qabul qilindi, 24 soat ichida bog'lanamiz.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[/api/orders] saqlashda xatolik:", error);
    return NextResponse.json(
      { error: "Buyurtmani saqlab bo'lmadi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 500 },
    );
  }
}
