/**
 * Fan-klubning ijtimoiy tarmoqlari — bitta joyda, sayt bo'ylab shu
 * ro'yxatdan olinadi (footer, fan-klub bo'limi, tomosha va
 * qo'llab-quvvatlash sahifalari).
 *
 * Havolasi hali yo'q tarmoq `null` qoladi va saytda ko'rsatilmaydi.
 */

/** Saytning tashqi manzili — Telegram postlari va bildirishnomalar uchun */
export const SITE_URL = "https://manchester-united.uz";

export type SocialKey = "telegram" | "instagram" | "youtube";

export interface SocialLink {
  key: SocialKey;
  label: string;
  /** Tarmoqdagi manzil (foydalanuvchiga ko'rsatiladi) */
  handle: string;
  href: string;
}

const RAW: Record<SocialKey, SocialLink | null> = {
  telegram: {
    key: "telegram",
    label: "Telegram",
    handle: "@red_devils_uzb",
    href: "https://t.me/red_devils_uzb",
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    handle: "@manchester.united.uz",
    href: "https://instagram.com/manchester.united.uz",
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    handle: "@manchester_united_uz",
    href: "https://www.youtube.com/@manchester_united_uz",
  },
};

/** Faqat havolasi bor tarmoqlar, ko'rsatish tartibida */
export const SOCIAL_LINKS: SocialLink[] = (["telegram", "instagram", "youtube"] as const)
  .map((k) => RAW[k])
  .filter((s): s is SocialLink => s !== null);

export const TELEGRAM_CHANNEL = RAW.telegram;
