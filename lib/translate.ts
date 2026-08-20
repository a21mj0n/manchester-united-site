import Anthropic from "@anthropic-ai/sdk";

/**
 * Yangilik sarlavhalarini o'zbek tiliga o'giradi.
 *
 * Manbalar ingliz tilida (Guardian, Manchester Evening News), sayt esa
 * o'zbekcha. Sarlavha so'zma-so'z ko'chirilmaydi — o'z so'zlarimiz bilan
 * qayta yoziladi va asl maqolaga havola qoladi.
 *
 * ANTHROPIC_API_KEY o'rnatilmagan bo'lsa null qaytaradi va chaqiruvchi
 * matnni o'zgarishsiz qoldiradi — sayt baribir ishlayveradi.
 */

const MODEL = "claude-opus-5";
const MAX_ITEMS = 20;

const SYSTEM_PROMPT = `Sen sport yangiliklarini o'zbek tiliga o'giradigan muharrirsan.
Sayt — Manchester United muxlislarining O'zbekistondagi jamoat sayti.

Qoidalar:
- O'zbek tilida, lotin yozuvida yoz.
- Sarlavhani so'zma-so'z tarjima qilma — o'z so'zlaring bilan qayta yoz,
  lekin ma'nosini o'zgartirma va yangi fakt qo'shma.
- Futbolchi, murabbiy va klub nomlarini asl holida qoldir
  (Bruno Fernandes, Old Trafford, Manchester United).
- Sarlavha qisqa bo'lsin: 90 belgidan oshmasin.
- Tavsif bir-ikki jumla, 200 belgidan oshmasin.
- Manbada ma'lumot kam bo'lsa, tavsifni bo'sh qoldir.
- Hech qanday izoh yozma, faqat JSON qaytar.`;

export interface NewsText {
  title: string;
  excerpt: string;
}

function buildPrompt(items: NewsText[]): string {
  const list = items
    .map((item, i) => `${i + 1}. Sarlavha: ${item.title}\n   Tavsif: ${item.excerpt || "(yo'q)"}`)
    .join("\n\n");

  return `Quyidagi ${items.length} ta yangilikni o'zbekchaga o'gir.

${list}

Javobni faqat JSON massiv ko'rinishida qaytar, elementlar soni va tartibi
kirish bilan bir xil bo'lsin:
[{"title": "...", "excerpt": "..."}, ...]`;
}

/** Javobdan JSON massivni ajratib oladi. Sinov uchun eksport qilingan. */
export function parseResponse(text: string, expected: number): NewsText[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length !== expected) return null;

  const result: NewsText[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== "object") return null;
    const { title, excerpt } = row as Record<string, unknown>;
    if (typeof title !== "string" || !title.trim()) return null;
    result.push({
      title: title.trim().slice(0, 200),
      excerpt: typeof excerpt === "string" ? excerpt.trim().slice(0, 300) : "",
    });
  }

  return result;
}

/**
 * Xatolikda null qaytaradi — tarjima bo'lmasa yangilik asl tilida qoladi,
 * bu yo'qolgandan ko'ra yaxshiroq.
 */
export async function translateNews(items: NewsText[]): Promise<NewsText[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || items.length === 0) return null;

  const batch = items.slice(0, MAX_ITEMS);

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      // Vazifa oddiy — chuqur o'ylash shart emas, arzonroq bo'ladi
      output_config: { effort: "low" },
      messages: [{ role: "user", content: buildPrompt(batch) }],
    });

    if (response.stop_reason === "refusal") {
      console.error("[translate] so'rov rad etildi:", response.stop_details);
      return null;
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = parseResponse(text, batch.length);
    if (!parsed) {
      console.error("[translate] javobni o'qib bo'lmadi:", text.slice(0, 200));
      return null;
    }

    return parsed;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`[translate] API xatosi ${error.status}:`, error.message);
    } else {
      console.error("[translate] xatolik:", error);
    }
    return null;
  }
}
