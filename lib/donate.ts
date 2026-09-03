import { prisma } from "./prisma";

/**
 * Donat (qo'llab-quvvatlash) sozlamalari.
 *
 * Hammasi bitta `Setting` qatorida JSON ko'rinishida saqlanadi — admin
 * panel o'zgartiradi, /support sahifasi o'qiydi. To'lov rekvizitlari kodda
 * emas, bazada turadi.
 */

export const DONATE_KEY = "donate";

export interface DonateSettings {
  /** Oylik maqsad, so'mda */
  goal: number;
  /** Shu oyda yig'ilgan summa, so'mda (admin qo'lda yangilaydi) */
  collected: number;
  /** Payme to'lov havolasi */
  paymeUrl: string;
  /** Click to'lov havolasi */
  clickUrl: string;
  /** Karta raqami (Uzcard / Humo) */
  cardNumber: string;
  /** Karta egasining ismi */
  cardOwner: string;
  /** Telegram orqali bog'lanish havolasi (masalan admin profili) */
  telegramUrl: string;
}

export const EMPTY_DONATE: DonateSettings = {
  goal: 0,
  collected: 0,
  paymeUrl: "",
  clickUrl: "",
  cardNumber: "",
  cardOwner: "",
  telegramUrl: "",
};

function toInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/\s/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Noma'lum obyektni xavfsiz DonateSettings ga aylantiradi. */
export function normalizeDonate(raw: unknown): DonateSettings {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    goal: toInt(o.goal),
    collected: toInt(o.collected),
    paymeUrl: toStr(o.paymeUrl),
    clickUrl: toStr(o.clickUrl),
    cardNumber: toStr(o.cardNumber),
    cardOwner: toStr(o.cardOwner),
    telegramUrl: toStr(o.telegramUrl),
  };
}

export async function getDonateSettings(): Promise<DonateSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: DONATE_KEY } });
    if (!row) return EMPTY_DONATE;
    return normalizeDonate(JSON.parse(row.value));
  } catch {
    // Baza yo'q muhitlarda (CI) yoki buzilgan JSON bo'lsa sahifa yiqilmasin
    return EMPTY_DONATE;
  }
}

export async function setDonateSettings(settings: DonateSettings): Promise<void> {
  const value = JSON.stringify(normalizeDonate(settings));
  await prisma.setting.upsert({
    where: { key: DONATE_KEY },
    update: { value },
    create: { key: DONATE_KEY, value },
  });
}

/** Kamida bitta to'lov usuli sozlanganmi */
export function hasPaymentMethod(s: DonateSettings): boolean {
  return Boolean(s.paymeUrl || s.clickUrl || s.cardNumber || s.telegramUrl);
}

/** 1234567 → "1 234 567" */
export function formatSum(n: number): string {
  return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Karta raqamini to'rttalik guruhlarga ajratadi */
export function formatCard(card: string): string {
  const digits = card.replace(/\D/g, "");
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

export function currentMonthUz(date = new Date()): string {
  return MONTHS_UZ[date.getMonth()];
}
