/**
 * Jamoa gerblari — Premer-liganing rasmiy SVG fayllari.
 *
 * Fayl raqami jamoaning Opta identifikatoriga teng (Arsenal t3 → 3.svg).
 * Ro'yxat Premer-liga API sidan olinadi, shuning uchun mavsum almashib,
 * liga tarkibi o'zgarsa ham o'zi yangilanadi.
 *
 * Eslatma: gerblar klublarning savdo belgisi. Ular jadval va o'yinlar
 * yonida tanish belgisi sifatida ko'rsatiladi, saytga egalik yoki
 * homiylik da'vosi qilinmaydi.
 */

const PL_API = "https://footballapi.pulselive.com/football";
const BADGE_BASE = "https://resources.premierleague.com/premierleague25/badges-alt";
const TIMEOUT_MS = 10000;

/** Turli manbalarda uchraydigan qisqartmalar */
const ALIASES: Record<string, string> = {
  "man utd": "manchester united",
  "man united": "manchester united",
  "man city": "manchester city",
  spurs: "tottenham hotspur",
  tottenham: "tottenham hotspur",
  wolves: "wolverhampton wanderers",
  "nottm forest": "nottingham forest",
  "nott m forest": "nottingham forest",
  brighton: "brighton hove albion",
  newcastle: "newcastle united",
  leeds: "leeds united",
  "west ham": "west ham united",
  bournemouth: "bournemouth",
  "afc bournemouth": "bournemouth",
  "sheffield utd": "sheffield united",
  "luton": "luton town",
  "ipswich": "ipswich town",
  "coventry": "coventry city",
  "hull": "hull city",
};

/** Nomni solishtirish uchun soddalashtiradi. */
export function normalizeTeam(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(fc|afc|association|football|club)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return ALIASES[base] ?? base;
}

interface PlTeam {
  name: string;
  altIds?: { opta?: string };
}

/**
 * Joriy mavsum jamoalari uchun "nom → gerb havolasi" jadvali.
 * Xatolikda bo'sh Map qaytaradi — gerbsiz ham sayt ishlayveradi.
 */
export async function fetchBadgeMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  try {
    const headers = { Origin: "https://www.premierleague.com" };

    const seasonsRes = await fetch(`${PL_API}/competitions/1/compseasons?pageSize=50`, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!seasonsRes.ok) throw new Error(`compseasons: ${seasonsRes.status}`);

    const seasons = (await seasonsRes.json()) as { content?: { id: number }[] };
    const seasonId = seasons.content?.[0]?.id;
    if (!seasonId) throw new Error("mavsum topilmadi");

    const teamsRes = await fetch(
      `${PL_API}/teams?pageSize=100&comps=1&compSeasons=${seasonId}&altIds=true`,
      { headers, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" },
    );
    if (!teamsRes.ok) throw new Error(`teams: ${teamsRes.status}`);

    const teams = (await teamsRes.json()) as { content?: PlTeam[] };

    for (const team of teams.content ?? []) {
      const opta = team.altIds?.opta;
      if (!opta) continue;
      const id = opta.replace(/^t/, "");
      if (!/^\d+$/.test(id)) continue;
      map.set(normalizeTeam(team.name), `${BADGE_BASE}/${id}.svg`);
    }
  } catch (error) {
    console.error("[badges] olishda xatolik:", error);
  }

  return map;
}

/** Nomi bo'yicha gerb havolasini topadi. */
export function badgeFor(map: Map<string, string>, team: string): string | null {
  return map.get(normalizeTeam(team)) ?? null;
}

/* =========================================================
   Gerblarni serverga yuklab olish
   ========================================================= */

/**
 * Gerblar reliz papkasidan tashqarida saqlanadi — deploy paytida
 * almashadigan `current/` ichida bo'lsa, har safar qaytadan yuklashga
 * to'g'ri kelardi.
 *
 * Production: /var/www/manchester-united-site/data/badges (nginx beradi)
 * Lokal:      ./public/badges (Next o'zi beradi)
 */
function badgeDir(): string {
  return process.env.BADGE_DIR || "./public/badges";
}

/** Fayl nomi faqat "<raqam>.svg" bo'lishi mumkin. */
function safeFileName(url: string): string | null {
  const name = url.split("/").pop() ?? "";
  return /^\d+\.svg$/.test(name) ? name : null;
}

/**
 * Gerblarni yuklab olib, mahalliy havolalarga almashtiradi.
 *
 * Bor fayl qayta yuklanmaydi. Bitta gerb yuklanmasa — o'sha jamoa
 * uchun tashqi havola qoladi, qolganlari mahalliy bo'ladi.
 */
export async function localizeBadges(
  remote: Map<string, string>,
): Promise<{ map: Map<string, string>; downloaded: number; failed: number }> {
  const { mkdir, writeFile, access } = await import("node:fs/promises");
  const { join } = await import("node:path");

  const dir = badgeDir();
  const map = new Map<string, string>();
  let downloaded = 0;
  let failed = 0;

  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    console.error("[badges] papka yaratilmadi:", error);
    return { map: remote, downloaded: 0, failed: remote.size };
  }

  for (const [team, url] of remote) {
    const name = safeFileName(url);
    if (!name) {
      map.set(team, url);
      continue;
    }

    const path = join(dir, name);
    const localUrl = `/badges/${name}`;

    // Allaqachon yuklangan bo'lsa qayta so'ramaymiz
    try {
      await access(path);
      map.set(team, localUrl);
      continue;
    } catch {
      // fayl yo'q — yuklaymiz
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error(`javob ${response.status}`);

      const type = response.headers.get("content-type") ?? "";
      if (!type.includes("svg")) throw new Error(`kutilmagan tur: ${type}`);

      const body = await response.text();
      if (!body.trimStart().startsWith("<svg") && !body.includes("<svg")) {
        throw new Error("SVG emas");
      }

      await writeFile(path, body, "utf8");
      map.set(team, localUrl);
      downloaded++;
    } catch (error) {
      console.error(`[badges] ${name} yuklanmadi:`, error);
      map.set(team, url); // tashqi havola zaxira sifatida qoladi
      failed++;
    }
  }

  return { map, downloaded, failed };
}
