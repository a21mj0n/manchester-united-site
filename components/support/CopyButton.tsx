"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Matnni buferga nusxalovchi kichik tugma (karta raqami uchun). */
export default function CopyButton({ text, label = "Nusxalash" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // Eski brauzerlarda clipboard bo'lmasligi mumkin — jim o'tamiz
    }
  }

  return (
    <button type="button" className="copy-btn" onClick={copy} aria-live="polite">
      {done ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      {done ? "Nusxalandi" : label}
    </button>
  );
}
