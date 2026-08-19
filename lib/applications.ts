import { prisma } from "./prisma";
import { isStatus, type Status } from "./status";

/** Arizalar ro'yxati, ixtiyoriy holat filtri bilan. */
export async function getApplications(status?: string) {
  return prisma.fanApplication.findMany({
    where: status && isStatus(status) ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

/** Har bir holat bo'yicha nechta ariza borligi. */
export async function getApplicationStats() {
  const grouped = await prisma.fanApplication.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<string, number> = { all: 0, new: 0, approved: 0, rejected: 0 };
  for (const row of grouped) {
    counts[row.status] = row._count._all;
    counts.all += row._count._all;
  }
  return counts;
}

/** Ariza holatini o'zgartiradi. */
export async function updateApplicationStatus(id: number, status: Status) {
  return prisma.fanApplication.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });
}
