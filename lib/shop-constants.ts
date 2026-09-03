/**
 * Do'kon konstantalari — client komponentlarda ham ishlatiladi,
 * shuning uchun bu faylda Prisma yoki boshqa server importlari bo'lmasligi kerak.
 */

export const ORDER_STATUSES = ["new", "contacted", "paid", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  paid: "To'landi",
  delivered: "Yetkazildi",
  cancelled: "Bekor",
};

export const MAX_QTY = 10;

export function parseSizes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
