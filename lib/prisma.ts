import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

/**
 * Prisma klientining yagona nusxasi (singleton).
 *
 * Next.js dev rejimida hot-reload har safar modulni qayta yuklaydi —
 * global o'zgaruvchida saqlamasak, har yuklashda yangi ulanish ochilib,
 * ular to'planib qoladi.
 *
 * Prisma 7 driver adapter talab qiladi: SQLite uchun better-sqlite3.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL o'rnatilmagan. .env faylini tekshiring (namuna: .env.example).",
    );
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
