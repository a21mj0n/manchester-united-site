/**
 * Ikki futbolchini taqqoslash uchun sof hisob-kitoblar.
 *
 * API chaqirmaydi — fetchLatestPlayerProfile natijasi ustida ishlaydi,
 * shuning uchun /compare sahifasi qo'shimcha limit sarflamaydi.
 */

import type { PlayerCompetitionStats, PlayerProfile } from "@/types/football";

/** Barcha musobaqalar yig'indisi (reyting va aniqlik — vaznlangan o'rtacha) */
export interface AggregatedStats {
  appearances: number;
  lineups: number;
  minutes: number;
  /** Daqiqalarga vaznlangan o'rtacha, 0-10 */
  rating: number | null;
  goals: number;
  assists: number;
  shots: number;
  shotsOn: number;
  passes: number;
  keyPasses: number;
  /** Uzatmalar soniga vaznlangan o'rtacha, % */
  passAccuracy: number | null;
  tackles: number;
  interceptions: number;
  dribblesWon: number;
  dribbleAttempts: number;
  duelsWon: number;
  duelsTotal: number;
  foulsDrawn: number;
  foulsCommitted: number;
  yellow: number;
  red: number;
  penaltyScored: number;
  penaltyMissed: number;
  saves: number;
  conceded: number;
}

const SUM_KEYS = [
  "appearances",
  "lineups",
  "minutes",
  "goals",
  "assists",
  "shots",
  "shotsOn",
  "passes",
  "keyPasses",
  "tackles",
  "interceptions",
  "dribblesWon",
  "dribbleAttempts",
  "duelsWon",
  "duelsTotal",
  "foulsDrawn",
  "foulsCommitted",
  "yellow",
  "red",
  "penaltyScored",
  "penaltyMissed",
  "saves",
  "conceded",
] as const;

export function aggregateStats(profile: PlayerProfile): AggregatedStats {
  const total = Object.fromEntries(SUM_KEYS.map((k) => [k, 0])) as Record<
    (typeof SUM_KEYS)[number],
    number
  >;

  let ratingWeight = 0;
  let ratingSum = 0;
  let accuracyWeight = 0;
  let accuracySum = 0;

  for (const c of profile.competitions) {
    for (const k of SUM_KEYS) total[k] += c[k];

    if (c.rating !== null && c.minutes > 0) {
      ratingWeight += c.minutes;
      ratingSum += Number(c.rating) * c.minutes;
    }
    if (c.passAccuracy !== null && c.passes > 0) {
      accuracyWeight += c.passes;
      accuracySum += c.passAccuracy * c.passes;
    }
  }

  return {
    ...total,
    rating: ratingWeight > 0 ? ratingSum / ratingWeight : null,
    passAccuracy: accuracyWeight > 0 ? accuracySum / accuracyWeight : null,
  };
}

/** 90 daqiqaga normallashtirilgan qiymat */
export function per90(value: number, minutes: number): number {
  return minutes > 0 ? (value * 90) / minutes : 0;
}

/** Foiz (0 ga bo'lishdan himoyalangan) */
export function pct(part: number, whole: number): number | null {
  return whole > 0 ? (part / whole) * 100 : null;
}

/* =============== Radar chart o'qlari =============== */

export interface RadarAxis {
  label: string;
  /** 0..1 — juftlik maksimumiga normallashtirilgan */
  a: number;
  b: number;
  /** Ko'rsatish uchun matn qiymatlar */
  aText: string;
  bText: string;
}

function axis(
  label: string,
  aVal: number,
  bVal: number,
  format: (v: number) => string,
  invert = false,
): RadarAxis {
  let a: number;
  let b: number;
  if (invert) {
    // Kam bo'lgani yaxshi (masalan o'tkazilgan gollar): eng kichigi 1 oladi
    const min = Math.min(aVal, bVal);
    a = aVal > 0 ? min / aVal : 1;
    b = bVal > 0 ? min / bVal : 1;
  } else {
    const max = Math.max(aVal, bVal);
    a = max > 0 ? aVal / max : 0;
    b = max > 0 ? bVal / max : 0;
  }
  return { label, a, b, aText: format(aVal), bText: format(bVal) };
}

const f2 = (v: number) => v.toFixed(2);
const f0pct = (v: number) => `${Math.round(v)}%`;

/** Maydon o'yinchilari uchun 6 o'qli radar */
export function outfieldRadarAxes(a: AggregatedStats, b: AggregatedStats): RadarAxis[] {
  return [
    axis("Gol xavfi", per90(a.goals, a.minutes), per90(b.goals, b.minutes), f2),
    axis(
      "Yaratuvchanlik",
      per90(a.assists + a.keyPasses, a.minutes),
      per90(b.assists + b.keyPasses, b.minutes),
      f2,
    ),
    axis("Dribling", per90(a.dribblesWon, a.minutes), per90(b.dribblesWon, b.minutes), f2),
    axis("Pas aniqligi", a.passAccuracy ?? 0, b.passAccuracy ?? 0, f0pct),
    axis(
      "Himoya",
      per90(a.tackles + a.interceptions, a.minutes),
      per90(b.tackles + b.interceptions, b.minutes),
      f2,
    ),
    axis(
      "Duellar",
      pct(a.duelsWon, a.duelsTotal) ?? 0,
      pct(b.duelsWon, b.duelsTotal) ?? 0,
      f0pct,
    ),
  ];
}

/** Ikkala futbolchi ham darvozabon bo'lsa */
export function gkRadarAxes(a: AggregatedStats, b: AggregatedStats): RadarAxis[] {
  return [
    axis("Seyvlar (90')", per90(a.saves, a.minutes), per90(b.saves, b.minutes), f2),
    axis(
      "Ishonchlilik",
      per90(a.conceded, a.minutes),
      per90(b.conceded, b.minutes),
      f2,
      true,
    ),
    axis("Pas aniqligi", a.passAccuracy ?? 0, b.passAccuracy ?? 0, f0pct),
    axis("Reyting", a.rating ?? 0, b.rating ?? 0, f2),
    axis("O'yinlar", a.appearances, b.appearances, (v) => String(Math.round(v))),
    axis("Daqiqalar", a.minutes, b.minutes, (v) => String(Math.round(v))),
  ];
}

/* =============== Ustun jihatlar =============== */

export type StrengthCategory = "attack" | "creativity" | "defense" | "discipline" | "gk" | "overall";

export interface Strength {
  category: StrengthCategory;
  label: string;
  /** "0.62 vs 0.31" ko'rinishidagi izoh */
  detail: string;
}

interface Metric {
  category: StrengthCategory;
  label: string;
  value: (s: AggregatedStats) => number | null;
  format: (v: number) => string;
  /** true — kam bo'lgani yaxshi */
  lowerIsBetter?: boolean;
  gkOnly?: boolean;
  outfieldOnly?: boolean;
}

const METRICS: Metric[] = [
  { category: "overall", label: "O'rtacha reyting", value: (s) => s.rating, format: f2 },
  {
    category: "attack",
    label: "Gol xavfi (90 daq.)",
    value: (s) => per90(s.goals, s.minutes),
    format: f2,
    outfieldOnly: true,
  },
  {
    category: "attack",
    label: "Zarba aniqligi",
    value: (s) => pct(s.shotsOn, s.shots),
    format: f0pct,
    outfieldOnly: true,
  },
  {
    category: "creativity",
    label: "Golli uzatmalar (90 daq.)",
    value: (s) => per90(s.assists, s.minutes),
    format: f2,
    outfieldOnly: true,
  },
  {
    category: "creativity",
    label: "Kalit uzatmalar (90 daq.)",
    value: (s) => per90(s.keyPasses, s.minutes),
    format: f2,
    outfieldOnly: true,
  },
  { category: "creativity", label: "Pas aniqligi", value: (s) => s.passAccuracy, format: f0pct },
  {
    category: "attack",
    label: "Dribling muvaffaqiyati",
    value: (s) => pct(s.dribblesWon, s.dribbleAttempts),
    format: f0pct,
    outfieldOnly: true,
  },
  {
    category: "defense",
    label: "To'p olib qo'yish (90 daq.)",
    value: (s) => per90(s.tackles + s.interceptions, s.minutes),
    format: f2,
    outfieldOnly: true,
  },
  {
    category: "defense",
    label: "Duel g'alabalari",
    value: (s) => pct(s.duelsWon, s.duelsTotal),
    format: f0pct,
  },
  {
    category: "discipline",
    label: "Intizom (kartochka 90 daq.)",
    value: (s) => per90(s.yellow + s.red * 2, s.minutes),
    format: f2,
    lowerIsBetter: true,
  },
  {
    category: "gk",
    label: "Seyvlar (90 daq.)",
    value: (s) => per90(s.saves, s.minutes),
    format: f2,
    gkOnly: true,
  },
  {
    category: "gk",
    label: "O'tkazilgan gollar (90 daq.)",
    value: (s) => per90(s.conceded, s.minutes),
    format: f2,
    lowerIsBetter: true,
    gkOnly: true,
  },
];

/** Kamida 10% farq bo'lsa ustunlik deb hisoblaymiz */
const MARGIN = 1.1;

/**
 * Har bir futbolchining raqibidan aniq ustun tomonlari.
 * bothGK — ikkalasi ham darvozabon (GK metrikalar qo'shiladi).
 */
export function computeStrengths(
  a: AggregatedStats,
  b: AggregatedStats,
  bothGK: boolean,
): { a: Strength[]; b: Strength[] } {
  const resA: Strength[] = [];
  const resB: Strength[] = [];

  for (const m of METRICS) {
    if (m.gkOnly && !bothGK) continue;
    if (m.outfieldOnly && bothGK) continue;

    const va = m.value(a);
    const vb = m.value(b);
    if (va === null || vb === null) continue;
    if (va === 0 && vb === 0) continue;

    const [hi, lo] = m.lowerIsBetter ? [Math.min(va, vb), Math.max(va, vb)] : [Math.max(va, vb), Math.min(va, vb)];
    const winnerIsA = m.lowerIsBetter ? va < vb : va > vb;

    // Nisbat orqali farq (0 bo'lsa — istalgan farq ustunlik)
    const enough = lo === 0 ? hi > 0 : (m.lowerIsBetter ? lo / hi : hi / lo) >= MARGIN;
    if (!enough || va === vb) continue;

    const strength: Strength = {
      category: m.category,
      label: m.label,
      detail: `${m.format(va)} vs ${m.format(vb)}`,
    };
    (winnerIsA ? resA : resB).push(strength);
  }

  return { a: resA, b: resB };
}

/* =============== Yordamchilar =============== */

/** Umumiy daqiqa juda kam bo'lsa taqqoslash ishonchsiz */
export function hasEnoughMinutes(s: AggregatedStats): boolean {
  return s.minutes >= 90;
}

export function isGoalkeeper(profile: PlayerProfile): boolean {
  return profile.position === "Goalkeeper";
}

/** Eng ko'p daqiqa o'ynalgan musobaqa (sarlavha uchun) */
export function mainCompetition(profile: PlayerProfile): PlayerCompetitionStats | null {
  return profile.competitions[0] ?? null;
}
