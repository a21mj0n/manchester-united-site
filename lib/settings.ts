import { prisma } from "./prisma";

/**
 * Kalit-qiymat sozlamalar. Hozircha yagona iste'molchi — /tomosha
 * sahifasidagi yashirin efir havolasi, uni admin panel o'zgartiradi.
 */

export const SECRET_STREAM_KEY = "secretStreamUrl";

/** Baza bo'sh bo'lsa yoki o'qib bo'lmasa ishlatiladigan havola */
export const DEFAULT_SECRET_STREAM_URL = "https://liveball.sx/match/1557368";

export async function getSecretStreamUrl(): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: SECRET_STREAM_KEY },
    });
    return row?.value ?? DEFAULT_SECRET_STREAM_URL;
  } catch {
    // CI kabi baza yo'q muhitlarda sahifa yiqilmasin
    return DEFAULT_SECRET_STREAM_URL;
  }
}

export async function setSecretStreamUrl(value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SECRET_STREAM_KEY },
    update: { value },
    create: { key: SECRET_STREAM_KEY, value },
  });
}
