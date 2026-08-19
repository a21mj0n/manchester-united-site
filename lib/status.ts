/**
 * Ariza holatlari — sof konstantalar.
 *
 * Alohida fayl, chunki bularni client komponentlar ham ishlatadi.
 * Agar ular lib/applications.ts dan olinsa, Prisma (va u orqali
 * better-sqlite3 native moduli) brauzer bundleiga tushib qoladi.
 */

export const STATUSES = ["new", "approved", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  new: "Yangi",
  approved: "Qabul qilingan",
  rejected: "Rad etilgan",
};

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}
