import { prisma } from "./prisma";

/**
 * Do'kon: mahsulotlar va buyurtmalar.
 *
 * Oldindan buyurtma rejimi — onlayn to'lov yo'q. Muxlis buyurtma qoldiradi,
 * admin bog'lanib to'lov va yetkazishni kelishadi, holatni admin panelda
 * o'zgartiradi.
 */

import {
  MAX_QTY,
  ORDER_STATUSES,
  parseSizes,
  type OrderStatus,
} from "./shop-constants";

export { MAX_QTY, ORDER_STATUSES, ORDER_STATUS_LABELS, parseSizes, type OrderStatus } from "./shop-constants";

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  sizes: string;
  active: boolean;
  sortOrder: number;
}

/** Nomdan URL uchun slug yasaydi: "Sharf «Old Trafford»" → "sharf-old-trafford" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ʻʼ'’`]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "mahsulot";
}

type ParseResult = { value: ProductInput } | { error: string };

/** Admin formasidan kelgan maydonlarni tekshiradi. */
export function parseProductForm(fd: FormData): ParseResult {
  const str = (k: string) => (typeof fd.get(k) === "string" ? String(fd.get(k)).trim() : "");

  const name = str("name");
  if (!name) return { error: "Mahsulot nomi majburiy." };
  if (name.length > 80) return { error: "Nom 80 belgidan oshmasin." };

  const description = str("description").slice(0, 1000);

  const price = Number(str("price").replace(/\s/g, ""));
  if (!Number.isInteger(price) || price <= 0 || price > 100_000_000) {
    return { error: "Narx noto'g'ri." };
  }

  const sizes = parseSizes(str("sizes")).map((s) => s.slice(0, 10)).slice(0, 12).join(",");

  const sortRaw = Number(str("sortOrder") || "0");
  const sortOrder = Number.isInteger(sortRaw) ? sortRaw : 0;

  const active = str("active") === "true" || str("active") === "on";

  return { value: { name, description, price, sizes, active, sortOrder } };
}

/** Takrorlanmaydigan slug: band bo'lsa oxiriga -2, -3 qo'shiladi */
export async function uniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/* ---------------- Mahsulotlar ---------------- */

export async function getActiveProducts(limit?: number) {
  try {
    return await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await prisma.product.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function getAllProducts() {
  return prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
}

/* ---------------- Buyurtmalar ---------------- */

export interface OrderInput {
  productId: number;
  size: string;
  qty: number;
  name: string;
  contact: string;
  city: string;
  note: string;
}

type OrderParse = { value: OrderInput } | { error: string };

export function parseOrderInput(body: unknown): OrderParse {
  if (!body || typeof body !== "object") return { error: "Ma'lumot yuborilmadi." };
  const b = body as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : "");

  const productId = Number(b.productId);
  if (!Number.isInteger(productId) || productId <= 0) return { error: "Mahsulot tanlanmagan." };

  const name = str("name", 100);
  const contact = str("contact", 100);
  const city = str("city", 60);
  if (!name || !contact || !city) return { error: "Ism, aloqa va shahar majburiy." };

  const qtyRaw = Number(b.qty ?? 1);
  const qty = Number.isInteger(qtyRaw) && qtyRaw >= 1 && qtyRaw <= MAX_QTY ? qtyRaw : 0;
  if (!qty) return { error: `Soni 1 dan ${MAX_QTY} gacha bo'lishi mumkin.` };

  return {
    value: { productId, size: str("size", 10), qty, name, contact, city, note: str("note", 500) },
  };
}

export async function getOrders(status: string) {
  const where = status === "all" ? {} : { status };
  return prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 300 });
}

export async function getOrderStats(): Promise<Record<string, number>> {
  const rows = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<string, number> = { all: 0 };
  for (const s of ORDER_STATUSES) counts[s] = 0;
  for (const r of rows) {
    counts[r.status] = r._count._all;
    counts.all += r._count._all;
  }
  return counts;
}
