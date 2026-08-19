import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { JoinRequest } from "@/lib/types";

/**
 * POST /api/join — fan-klubga ariza.
 * Ariza tekshiriladi va ma'lumotlar bazasiga yoziladi.
 */
export async function POST(request: Request) {
  let body: Partial<JoinRequest>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  const name = body.name?.trim();
  const city = body.city?.trim();
  const contact = body.contact?.trim();

  if (!name || !city || !contact) {
    return NextResponse.json(
      { error: "Ism, shahar va aloqa ma'lumoti majburiy." },
      { status: 400 },
    );
  }

  if (name.length > 100 || contact.length > 100 || city.length > 100) {
    return NextResponse.json({ error: "Maydon juda uzun." }, { status: 400 });
  }

  const since = typeof body.since === "number" ? body.since : undefined;
  if (since !== undefined && (since < 1878 || since > 2030)) {
    return NextResponse.json({ error: "Yil noto'g'ri kiritilgan." }, { status: 400 });
  }

  try {
    const application = await prisma.fanApplication.create({
      data: { name, city, contact, since },
      select: { id: true },
    });

    return NextResponse.json(
      {
        id: application.id,
        message: `Rahmat, ${name}! Arizangiz qabul qilindi. Glory Glory Man United! 🔴`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[/api/join] bazaga yozishda xatolik:", error);
    return NextResponse.json(
      { error: "Arizani saqlab bo'lmadi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 500 },
    );
  }
}
