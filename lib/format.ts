/**
 * Sanani Toshkent vaqtida formatlaydi.
 *
 * Intl.DateTimeFormat ishlatilmaydi, chunki Node va brauzerdagi
 * lokal ma'lumotlar bazasi farq qiladi — server "19/08/2026, 17:26",
 * brauzer esa "2026-08-19 17:26" chiqarib, gidratatsiya xatosi beradi.
 * Bundan tashqari server UTC da ishlaydi, foydalanuvchi esa +5 da.
 *
 * O'zbekistonda yozgi vaqtga o'tish yo'q, shuning uchun doimiy +5.
 */

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

export function formatTashkentDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + TASHKENT_OFFSET_MS);
  return (
    `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}` +
    ` ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}
