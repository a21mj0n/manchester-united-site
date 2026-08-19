/**
 * Admin autentifikatsiyasi.
 *
 * Tashqi kutubxonasiz: parol scrypt bilan xeshlanadi, sessiya esa
 * HMAC-SHA256 bilan imzolangan cookie'da saqlanadi.
 *
 * Imzolash/tekshirish Web Crypto orqali — u ham Node, ham Edge
 * muhitida ishlaydi, shuning uchun middleware ichida ham yaraydi.
 */

const COOKIE_NAME = "mu_admin";
const SESSION_HOURS = 12;

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function fromB64url(value: string): Uint8Array<ArrayBuffer> {
  const buffer = Buffer.from(value, "base64url");
  // Web Crypto ArrayBuffer'ga tayangan Uint8Array talab qiladi,
  // Buffer esa umumiy ArrayBufferLike ustida turadi.
  const bytes = new Uint8Array(new ArrayBuffer(buffer.length));
  bytes.set(buffer);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET o'rnatilmagan yoki juda qisqa (kamida 32 belgi). .env.example ga qarang.",
    );
  }
  return secret;
}

/** Imzolangan sessiya tokenini yaratadi. */
export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  });
  const payloadPart = b64url(encoder.encode(payload));

  const key = await hmacKey(requireSecret());
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadPart));

  return `${payloadPart}.${b64url(new Uint8Array(signature))}`;
}

/** Tokenni tekshiradi: imzo to'g'rimi va muddati o'tmaganmi. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return false;

  let key: CryptoKey;
  try {
    key = await hmacKey(requireSecret());
  } catch {
    return false;
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromB64url(signaturePart),
    encoder.encode(payloadPart),
  );
  if (!valid) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payloadPart, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export const sessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_HOURS * 60 * 60,
};
