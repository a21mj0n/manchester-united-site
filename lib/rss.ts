/**
 * Oddiy RSS o'quvchi — tashqi kutubxonasiz.
 *
 * Faqat sarlavha, havola, qisqa tavsif va sana olinadi.
 * Maqola matni ko'chirilmaydi: bizning saytimizda sarlavha va
 * manbaga havola ko'rsatiladi, o'quvchi asl maqolaga o'tadi.
 */

export interface FeedItem {
  title: string;
  link: string;
  guid: string;
  description: string;
  publishedAt: Date | null;
}

const TIMEOUT_MS = 15000;

/** HTML/XML belgilarini oddiy matnga aylantiradi. */
function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#0?39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decode(match[1]) : "";
}

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "RedDevilsUzbekistan/1.0 (+https://manchester-united.uz)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`RSS javob bermadi: ${response.status}`);

  const xml = await response.text();
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  const items: FeedItem[] = [];

  for (const block of blocks) {
    const title = tag(block, "title");
    const link = tag(block, "link");
    if (!title || !link) continue;

    const rawDate = tag(block, "pubDate");
    const parsed = rawDate ? new Date(rawDate) : null;

    items.push({
      title,
      link,
      guid: tag(block, "guid") || link,
      description: tag(block, "description").slice(0, 300),
      publishedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed : null,
    });
  }

  return items;
}
