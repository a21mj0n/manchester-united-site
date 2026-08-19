import { prisma } from "./prisma";
import { DEFAULT_NEWS, type NewsItem } from "./news-defaults";

/**
 * Yangiliklar bazadan olinadi. Baza bo'sh bo'lsa (masalan, yangi
 * o'rnatilgan sayt) bosh sahifa bo'm-bo'sh ko'rinmasligi uchun
 * standart kartalar ko'rsatiladi.
 */
export async function getPublishedNews(): Promise<NewsItem[]> {
  try {
    const posts = await prisma.newsPost.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 8,
    });

    if (posts.length === 0) return DEFAULT_NEWS;

    return posts.map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      tag: p.tag,
      tagColor: p.tagColor,
      image: p.image,
      meta: p.meta,
      featured: p.featured,
    }));
  } catch (error) {
    console.error("[news] bazadan o'qib bo'lmadi:", error);
    return DEFAULT_NEWS;
  }
}

/** Admin uchun — nashr qilinmaganlari ham. */
export async function getAllNews() {
  return prisma.newsPost.findMany({ orderBy: { createdAt: "desc" } });
}

export interface NewsInput {
  title: string;
  excerpt: string;
  tag: string;
  tagColor: string;
  image: number;
  meta: string;
  featured: boolean;
  published: boolean;
}

export async function createNews(data: NewsInput) {
  return prisma.newsPost.create({ data, select: { id: true } });
}

export async function updateNews(id: number, data: Partial<NewsInput>) {
  return prisma.newsPost.update({ where: { id }, data, select: { id: true } });
}

export async function deleteNews(id: number) {
  return prisma.newsPost.delete({ where: { id }, select: { id: true } });
}
