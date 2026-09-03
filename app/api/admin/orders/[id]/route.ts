import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/shop";

/** PATCH /api/admin/orders/[id] — buyurtma holatini o'zgartirish. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status;
  if (typeof status !== "string" || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Holat noto'g'ri." }, { status: 400 });
  }

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Buyurtma topilmadi." }, { status: 404 });
  }
}
