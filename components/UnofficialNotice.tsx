/**
 * Sayt rasmiy emasligi haqidagi ochiq izoh.
 * Footerdagi izohdan tashqari, bosh sahifaning ko'rinadigan joyida turadi.
 */
import { Info } from "lucide-react";

export default function UnofficialNotice() {
  return (
    <aside className="disclaimer" role="note">
      <div className="container disclaimer__inner">
        <Info size={18} className="disclaimer__icon" aria-hidden="true" />
        <p>
          Bu <b>rasmiy bo'lmagan</b> muxlislar sayti. Manchester United FC bilan
          bog'liq emas va klub nomidan ish ko'rmaydi. Rasmiy sayt:{" "}
          <a href="https://www.manutd.com" target="_blank" rel="noopener noreferrer">
            manutd.com
          </a>
        </p>
      </div>
    </aside>
  );
}
