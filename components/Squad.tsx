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

function PlayerCard({ player, index }: { player: Player; index: number }) {
  return (
    <article className="player" style={{ animationDelay: `${index * 40}ms` }}>
      <span className="player__num">{player.num || "—"}</span>

      {player.photo ? (
        /* Rasm optimizatsiyasi serverni yuklamasligi uchun oddiy img */
        <img
          className="player__photo"
          src={player.photo}
          alt=""
          width={72}
          height={72}
          loading="lazy"
        />
      ) : (
        <div className="player__shirt">{player.num || "—"}</div>
      )}

      <h3 className="player__name">{player.name}</h3>
      <p className="player__pos">{player.posName}</p>
      {player.country && <p className="player__country">🌍 {player.country}</p>}
      {player.age !== undefined && <p className="player__country">{player.age} yosh</p>}
    </article>
  );
}

export default function Squad({ players }: { players: Player[] }) {
  const [pos, setPos] = useState<Position | "all">("all");
  const [showAcademy, setShowAcademy] = useState(false);

  const byPosition = pos === "all" ? players : players.filter((p) => p.pos === pos);
  const first = byPosition.filter((p) => !p.isAcademy);
  const academy = byPosition.filter((p) => p.isAcademy);

  return (
    <section className="section" id="squad">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Jamoa tarkibi</h2>
          <p className="section__sub">
            Qizil futbolkani kiyib maydonga chiqadigan o&apos;yinchilar
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
          {first.map((p, i) => (
            <PlayerCard key={p.id} player={p} index={i} />
          ))}
        </div>

        {first.length === 0 && (
          <p className="admin__empty">Bu pozitsiyada asosiy tarkibda o&apos;yinchi yo&apos;q.</p>
        )}

        {academy.length > 0 && (
          <div className="squad-academy">
            <button
              className="squad-academy__toggle"
              onClick={() => setShowAcademy((v) => !v)}
              aria-expanded={showAcademy}
            >
              <span>
                Akademiya va zaxira
                <b>{academy.length}</b>
              </span>
              <span className="squad-academy__arrow">{showAcademy ? "▲" : "▼"}</span>
            </button>

            {showAcademy && (
              <>
                <p className="squad-academy__note">
                  18 yoshgacha bo&apos;lgan hamda asosiy tarkib o&apos;yinchisi bilan bir xil
                  raqam ostidagi futbolchilar. Manba rasmiy ajratma bermaydi —
                  ro&apos;yxat shu ikki belgi asosida tuzilgan, shuning uchun
                  ayrim nomlar noto&apos;g&apos;ri guruhda bo&apos;lishi mumkin.
                </p>
                <div className="squad-grid">
                  {academy.map((p, i) => (
                    <PlayerCard key={p.id} player={p} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
