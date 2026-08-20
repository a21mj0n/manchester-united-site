"use client";

import { useState } from "react";
import type { Player, Position } from "@/lib/types";

const FILTERS: { key: Position | "all"; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "GK", label: "Darvozabon" },
  { key: "DF", label: "Himoyachi" },
  { key: "MF", label: "Yarim himoyachi" },
  { key: "FW", label: "Hujumchi" },
];

export default function Squad({ players }: { players: Player[] }) {
  const [pos, setPos] = useState<Position | "all">("all");
  const list = pos === "all" ? players : players.filter((p) => p.pos === pos);

  return (
    <section className="section" id="squad">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Jamoa tarkibi</h2>
          <p className="section__sub">
            Qizil futbolkani kiyib maydonga chiqadigan o'yinchilar
          </p>
        </div>

        <div className="filters reveal">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip${pos === f.key ? " is-active" : ""}`}
              onClick={() => setPos(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="squad-grid">
          {list.map((p, i) => (
            <article
              className="player"
              key={p.id}
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span className="player__num">{p.num || "—"}</span>

              {p.photo ? (
                /* Rasm optimizatsiyasi serverni yuklamasligi uchun oddiy img */
                <img
                  className="player__photo"
                  src={p.photo}
                  alt=""
                  width={72}
                  height={72}
                  loading="lazy"
                />
              ) : (
                <div className="player__shirt">{p.num || "—"}</div>
              )}

              <h3 className="player__name">{p.name}</h3>
              <p className="player__pos">{p.posName}</p>
              {p.country && <p className="player__country">🌍 {p.country}</p>}
              {p.age !== undefined && <p className="player__country">{p.age} yosh</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
