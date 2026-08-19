import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Parol xeshlash — scrypt (Node'ning o'z moduli, tashqi paket kerak emas).
 * Faqat server tomonda ishlatiladi (login route va CLI skript).
 *
 * Format: scrypt:<salt_hex>:<hash_hex>
 *
 * Ajratgich sifatida ":" ishlatiladi, "$" emas — Next.js .env fayllarida
 * "$" belgisini o'zgaruvchi deb talqin qilib, qiymatni buzib yuboradi.
 */

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length,
  )) as Buffer;

  // Uzunliklar teng bo'lmasa timingSafeEqual xato beradi
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
