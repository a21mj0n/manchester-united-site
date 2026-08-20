/**
 * Baza bo'sh bo'lganda ko'rsatiladigan standart yangiliklar.
 * Sof ma'lumot — client komponentlar ham ishlatishi mumkin.
 */

export interface NewsItem {
  title: string;
  excerpt: string;
  tag: string;
  tagColor: string;
  image: number;
  meta: string;
  featured: boolean;
  /** Tashqi manbadan olingan bo'lsa — nomi va asl maqola havolasi */
  sourceName?: string;
  sourceUrl?: string;
}

export const TAG_COLORS = ["default", "red", "gold"] as const;

export const DEFAULT_NEWS: NewsItem[] = [
  {
    title: "Toshkentda birgalikda o'yin tomoshasi",
    excerpt:
      "Har bir derbi o'yinida biz Toshkent markazidagi sport-barda yig'ilamiz. Sharf, ashula va 300 nafar qizil yurak.",
    tag: "Fan-klub",
    tagColor: "red",
    image: 1,
    meta: "Har hafta · Toshkent",
    featured: true,
  },
  {
    title: "Yoshlar akademiyasidan yangi iste'dodlar",
    excerpt: "Carrington maydonlarida o'sgan navbatdagi avlod birinchi jamoaga yo'l oldi.",
    tag: "Akademiya",
    tagColor: "default",
    image: 2,
    meta: "Old Trafford",
    featured: false,
  },
  {
    title: "Transfer oynasi: nimalarni kutamiz",
    excerpt: "Yarim mudofaa va hujum chizig'ini kuchaytirish — jamoaning asosiy vazifasi.",
    tag: "Transfer",
    tagColor: "default",
    image: 3,
    meta: "Tahlil",
    featured: false,
  },
  {
    title: "1999 — uchlik g'alaba tarixi",
    excerpt:
      "Premer-liga, FA Kubogi va Chempionlar ligasi. Futbol tarixidagi eng buyuk mavsum.",
    tag: "Tarix",
    tagColor: "gold",
    image: 4,
    meta: "Retro",
    featured: false,
  },
];
