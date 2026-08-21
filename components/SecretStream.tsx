"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";

// Yashirin jonli efir — faqat o'z bilganlar uchun :)
const SECRET_URL = "https://liveball.sx/match/1557368";
const NEEDED = 5;

export default function SecretStream() {
  const [taps, setTaps] = useState(0);
  const revealed = taps >= NEEDED;

  if (revealed) {
    return (
      <div className="secret">
        <div className="secret__card">
          <span className="tag tag--gold">Yashirin</span>
          <h3>Jonli efir topildi 🤫</h3>
          <p>Bu havola faqat o'z bilganlar uchun. Hech kimga aytmang!</p>
          <a
            href={SECRET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
          >
            <ExternalLink size={16} aria-hidden="true" />
            Efirga o'tish
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="secret">
      <button
        className="secret__trigger"
        onClick={() => setTaps((t) => t + 1)}
        aria-label="Sirli tugma"
      >
        ⚽
      </button>
      {taps > 0 && (
        <p className="secret__hint">Yana {NEEDED - taps} marta bosing…</p>
      )}
    </div>
  );
}
