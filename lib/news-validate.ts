import type { NewsInput } from "./news";
import { TAG_COLORS } from "./news-defaults";

type ParseResult = { value: NewsInput } | { error: string };

/** Formadan kelgan ma'lumotni tekshiradi va tozalaydi. */
export function parseNewsInput(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { error: "Ma'lumot yuborilmadi." };

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const excerpt = typeof b.excerpt === "string" ? b.excerpt.trim() : "";

  if (!title || !excerpt) return { error: "Sarlavha va matn majburiy." };
  if (title.length > 120) return { error: "Sarlavha 120 belgidan oshmasligi kerak." };
  if (excerpt.length > 400) return { error: "Matn 400 belgidan oshmasligi kerak." };

  const tag = typeof b.tag === "string" && b.tag.trim() ? b.tag.trim().slice(0, 30) : "Yangilik";
  const tagColor =
    typeof b.tagColor === "string" && (TAG_COLORS as readonly string[]).includes(b.tagColor)
      ? b.tagColor
      : "default";

  const imageRaw = Number(b.image);
  const image = Number.isInteger(imageRaw) && imageRaw >= 1 && imageRaw <= 4 ? imageRaw : 1;

  const meta = typeof b.meta === "string" ? b.meta.trim().slice(0, 60) : "";

  return {
    value: {
      title,
      excerpt,
      tag,
      tagColor,
      image,
      meta,
      featured: b.featured === true,
      published: b.published !== false,
    },
  };
}
