/**
 * Donat (qo'llab-quvvatlash) havolasi — Taps xizmati orqali.
 *
 * Taps sahifasida muxlis summani tanlab karta orqali to'laydi, pul
 * fan-klub hisobiga tushadi. Havola ochiq, shuning uchun kodda turadi;
 * oylik maqsad va boshqa rekvizitlar esa admin paneldan (lib/donate.ts).
 */

export const TAPS_URL = "https://taps.uz/manchesteruniteduz";

/** Taps sahifasidagi tayyor summalar — saytda ham shular ko'rsatiladi */
export const TAPS_AMOUNTS = [5_000, 10_000, 20_000, 50_000] as const;
