import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Yuklangan rasmlar (do'kon mahsulotlari).
 *
 * Gerblar kabi reliz papkasidan tashqarida saqlanadi, deploy ularga tegmaydi.
 * Production: UPLOAD_DIR (odatda data/uploads), lokal: ./public/uploads.
 * Fayllar /uploads/<nom> yo'li orqali beriladi (app/uploads/[name]/route.ts).
 */

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function uploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  if (process.env.BADGE_DIR) return join(dirname(process.env.BADGE_DIR), "uploads");
  return "./public/uploads";
}

/** Fayl boshidagi baytlar bo'yicha turini aniqlaydi — kengaytmaga ishonmaymiz */
function detectExt(bytes: Uint8Array): keyof typeof TYPES | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "webp";
  return null;
}

export function isSafeUploadName(name: string): boolean {
  return /^[a-f0-9]{16}\.(jpg|png|webp)$/.test(name);
}

export function contentTypeFor(name: string): string {
  const ext = name.split(".").pop() ?? "";
  return TYPES[ext] ?? "application/octet-stream";
}

/** Rasmni saqlaydi, /uploads/<nom> yo'lini qaytaradi. Xato bo'lsa matn qaytaradi. */
export async function saveUpload(file: File): Promise<{ path: string } | { error: string }> {
  if (file.size === 0) return { error: "Fayl bo'sh." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Rasm 2 MB dan katta bo'lmasin." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectExt(bytes);
  if (!ext) return { error: "Faqat JPG, PNG yoki WebP rasm bo'lishi mumkin." };

  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), bytes);
  return { path: `/uploads/${name}` };
}

/** /uploads/<nom> yo'lidagi faylni o'chiradi. Yo'q bo'lsa jim o'tadi. */
export async function deleteUpload(path: string | null | undefined): Promise<void> {
  if (!path) return;
  const name = path.split("/").pop() ?? "";
  if (!isSafeUploadName(name)) return;
  try {
    await unlink(join(uploadDir(), name));
  } catch {
    // allaqachon yo'q
  }
}

export async function readUpload(name: string): Promise<Buffer | null> {
  if (!isSafeUploadName(name)) return null;
  const full = join(uploadDir(), name);
  try {
    await access(full);
    return await readFile(full);
  } catch {
    return null;
  }
}
