/**
 * Telegram bildirishnomalari.
 *
 * TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID o'rnatilmagan bo'lsa,
 * funksiya jimgina hech narsa qilmaydi — sayt baribir ishlayveradi.
 */

const API_TIMEOUT_MS = 5000;
/** Sinovda soxta serverga yo'naltirish uchun; odatda o'zgartirilmaydi */
const API_BASE = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";

/** Telegram HTML rejimida maxsus belgilarni ekranlash. */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export interface ApplicationNotice {
  id: number;
  name: string;
  city: string;
  contact: string;
  since?: number;
}

/** Yangi ariza haqidagi xabar matnini tayyorlaydi. */
export function buildApplicationMessage(app: ApplicationNotice): string {
  const lines = [
    "🔴 <b>Yangi fan-klub arizasi</b>",
    "",
    `<b>Ism:</b> ${escapeHtml(app.name)}`,
    `<b>Shahar:</b> ${escapeHtml(app.city)}`,
    `<b>Aloqa:</b> ${escapeHtml(app.contact)}`,
  ];

  if (app.since !== undefined) {
    lines.push(`<b>Muxlis:</b> ${app.since}-yildan beri`);
  }

  lines.push("", `<a href="https://manchester-united.uz/admin">Admin panelda ko'rish</a>`);
  return lines.join("\n");
}

export interface OrderNotice {
  id: number;
  productName: string;
  price: number;
  size: string;
  qty: number;
  name: string;
  contact: string;
  city: string;
  note: string;
}

/** Yangi buyurtma haqidagi xabar matni. */
export function buildOrderMessage(o: OrderNotice): string {
  const sum = String(o.price * o.qty).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const lines = [
    "🛍 <b>Yangi buyurtma</b>",
    "",
    `<b>Mahsulot:</b> ${escapeHtml(o.productName)}${o.size ? ` (${escapeHtml(o.size)})` : ""} × ${o.qty}`,
    `<b>Summa:</b> ${sum} so'm`,
    `<b>Ism:</b> ${escapeHtml(o.name)}`,
    `<b>Aloqa:</b> ${escapeHtml(o.contact)}`,
    `<b>Shahar:</b> ${escapeHtml(o.city)}`,
  ];
  if (o.note) lines.push(`<b>Izoh:</b> ${escapeHtml(o.note)}`);
  lines.push("", `<a href="https://manchester-united.uz/admin/orders">Buyurtmalarni ko'rish</a>`);
  return lines.join("\n");
}

/**
 * Admin chatiga xabar yuboradi. Hech qachon xato tashlamaydi —
 * bildirishnoma yetkazilmagani asosiy oqimni buzmasligi kerak.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return false; // sozlanmagan — jimgina o'tkazamiz
  return sendTelegramTo(chatId, text);
}

/**
 * Ko'rsatilgan chat yoki kanalga xabar yuboradi. Kanal uchun
 * "@kanal_nomi" ko'rinishi ishlaydi, bot kanalda administrator bo'lishi kerak.
 * Muvaffaqiyatsizlikda sababini log'ga yozadi va false qaytaradi.
 */
export async function sendTelegramTo(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error("[telegram] yuborilmadi:", response.status, details.slice(0, 200));
      return false;
    }

    return true;
  } catch (error) {
    console.error("[telegram] xatolik:", error);
    return false;
  }
}
