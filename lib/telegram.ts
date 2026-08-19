/**
 * Telegram bildirishnomalari.
 *
 * TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID o'rnatilmagan bo'lsa,
 * funksiya jimgina hech narsa qilmaydi — sayt baribir ishlayveradi.
 */

const API_TIMEOUT_MS = 5000;

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

/**
 * Xabarni yuboradi. Hech qachon xato tashlamaydi —
 * bildirishnoma yetkazilmagani asosiy oqimni buzmasligi kerak.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return false; // sozlanmagan — jimgina o'tkazamiz

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
