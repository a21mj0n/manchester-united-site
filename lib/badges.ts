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
