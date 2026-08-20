const POSITIONS: Record<string, string> = {
  GK: "Darvozabon",
  DF: "Himoyachi",
  MF: "Yarim himoyachi",
  FW: "Hujumchi",
};

export interface PlayerInput {
  name: string;
  num: number;
  pos: string;
  posName: string;
  age: number | null;
  photo: string | null;
  isAcademy: boolean;
}

type ParseResult = { value: PlayerInput } | { error: string };

/** Admin formasidan kelgan o'yinchi ma'lumotini tekshiradi. */
export function parsePlayerInput(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { error: "Ma'lumot yuborilmadi." };
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { error: "Ism majburiy." };
  if (name.length > 80) return { error: "Ism juda uzun." };

  const num = Number(b.num);
  if (!Number.isInteger(num) || num < 0 || num > 99) {
    return { error: "Raqam 0 va 99 orasida bo'lishi kerak." };
  }

  const pos = typeof b.pos === "string" ? b.pos : "";
  if (!POSITIONS[pos]) return { error: "Pozitsiya noto'g'ri." };

  let age: number | null = null;
  if (b.age !== null && b.age !== undefined && b.age !== "") {
    const parsed = Number(b.age);
    if (!Number.isInteger(parsed) || parsed < 14 || parsed > 50) {
      return { error: "Yosh 14 va 50 orasida bo'lishi kerak." };
    }
    age = parsed;
  }

  let photo: string | null = null;
  if (typeof b.photo === "string" && b.photo.trim()) {
    const url = b.photo.trim();
    if (!/^https:\/\//.test(url)) return { error: "Rasm havolasi https bilan boshlanishi kerak." };
    if (url.length > 300) return { error: "Rasm havolasi juda uzun." };
    photo = url;
  }

  return {
    value: {
      name,
      num,
      pos,
      posName: POSITIONS[pos],
      age,
      photo,
      isAcademy: b.isAcademy === true,
    },
  };
}
