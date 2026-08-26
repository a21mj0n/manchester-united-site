"use client";

import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import type { Player, Position } from "@/lib/types";

interface Props {
  players: Player[];
  p1: number | null;
  p2: number | null;
}

const GROUPS: { pos: Position; label: string }[] = [
  { pos: "GK", label: "Darvozabonlar" },
  { pos: "DF", label: "Himoyachilar" },
  { pos: "MF", label: "Yarim himoyachilar" },
  { pos: "FW", label: "Hujumchilar" },
];

/**
 * Ikki futbolchini tanlash — tanlov URL orqali serverga uzatiladi.
 * Tanlovlar lokal state'da ham saqlanadi, aks holda ketma-ket tez
 * tanlashda birinchi tanlov URL'ga yetib bormasidan yo'qolib qolardi.
 */
export default function CompareSelect({ players, p1: p1Prop, p2: p2Prop }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [p1, setP1] = useState(p1Prop);
  const [p2, setP2] = useState(p2Prop);

  // Orqaga/oldinga navigatsiyada URL'dagi holatga qaytamiz
  useEffect(() => {
    setP1(p1Prop);
    setP2(p2Prop);
  }, [p1Prop, p2Prop]);

  const go = (a: number | null, b: number | null) => {
    setP1(a);
    setP2(b);
    const params = new URLSearchParams();
    if (a) params.set("p1", String(a));
    if (b) params.set("p2", String(b));
    startTransition(() => {
      router.push(`/compare${params.size > 0 ? `?${params}` : ""}`, { scroll: false });
    });
  };

  const renderOptions = (excludeId: number | null) =>
    GROUPS.map((g) => {
      const group = players.filter((p) => p.pos === g.pos && p.apiId && p.apiId !== excludeId);
      if (group.length === 0) return null;
      return (
        <optgroup key={g.pos} label={g.label}>
          {group.map((p) => (
            <option key={p.apiId} value={p.apiId}>
              {p.num > 0 ? `${p.num} — ` : ""}
              {p.name}
            </option>
          ))}
        </optgroup>
      );
    });

  return (
    <div className={`compare-select${isPending ? " is-pending" : ""}`}>
      <label className="field">
        <span>Birinchi futbolchi</span>
        <select
          value={p1 ?? ""}
          onChange={(e) => go(Number(e.target.value) || null, p2)}
        >
          <option value="">Tanlang…</option>
          {renderOptions(p2)}
        </select>
      </label>

      <button
        type="button"
        className="btn btn--ghost compare-select__swap"
        onClick={() => go(p2, p1)}
        disabled={!p1 && !p2}
        aria-label="O'rnini almashtirish"
        title="O'rnini almashtirish"
      >
        <ArrowLeftRight size={16} aria-hidden="true" />
      </button>

      <label className="field">
        <span>Ikkinchi futbolchi</span>
        <select
          value={p2 ?? ""}
          onChange={(e) => go(p1, Number(e.target.value) || null)}
        >
          <option value="">Tanlang…</option>
          {renderOptions(p1)}
        </select>
      </label>
    </div>
  );
}
