import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

/**
 * Prisma klienti — "dangasa" (lazy) singleton.
 *
 * Klient modul yuklanganda emas, birinchi marta ishlatilganda yaratiladi.
 * Bu muhim: `next build` route fayllarini import qiladi va agar klient
 * modul darajasida yaratilsa, build paytida DATABASE_URL talab qilinardi
 * (CI da .env yo'q — build tushib qolardi).
 *
 * Dev rejimida hot-reload modulni qayta yuklaydi, shuning uchun klient
 * global o'zgaruvchida saqlanadi — aks holda ulanishlar to'planib qoladi.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (client) return client;
  if (globalForPrisma.prisma) {
    client = globalForPrisma.prisma;
    return client;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL o'rnatilmagan. .env faylini tekshiring (namuna: .env.example).",
    );
  }

  client = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/** Klient bilan odatdagidek ishlash mumkin: prisma.fanApplication.create(...) */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const instance = getClient();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
