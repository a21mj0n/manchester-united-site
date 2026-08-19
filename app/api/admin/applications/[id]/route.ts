import { NextResponse } from "next/server";
import { updateApplicationStatus } from "@/lib/applications";
import { isStatus } from "@/lib/status";

/**
 * PATCH /api/admin/applications/[id] — ariza holatini o'zgartirish.
 * Middleware bu yo'lni allaqachon himoyalagan.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId < 1) {
    return NextResponse.json({ error: "ID noto'g'ri." }, { status: 400 });
  }

  let status: unknown;
  try {
    ({ status } = await request.json());
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });
  }

  if (typeof status !== "string" || !isStatus(status)) {
    return NextResponse.json({ error: "Holat noto'g'ri." }, { status: 400 });
  }

  try {
    const updated = await updateApplicationStatus(applicationId, status);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[admin] holatni o'zgartirishda xatolik:", error);
    return NextResponse.json({ error: "Ariza topilmadi." }, { status: 404 });
  }
}
