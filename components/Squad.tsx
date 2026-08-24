"use client";

import { ChevronDown, ChevronUp, Globe, GraduationCap } from "lucide-react";
import Link from "next/link";
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
  const body = (
    <>
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
      {player.country && (
        <p className="player__country">
          <Globe size={13} aria-hidden="true" />
          {player.country}
        </p>
      )}
      {player.age !== undefined && <p className="player__country">{player.age} yosh</p>}
    </>
  );

  // API identifikatori bo'lsa statistika sahifasiga olib boradi
  if (player.apiId) {
    return (
      <Link
        href={`/squad/${player.apiId}`}
        className="player player--link"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        {body}
      </Link>
    );
  }

  return (
    <article className="player" style={{ animationDelay: `${index * 40}ms` }}>
      {body}
    </article>
  );
}

interface Props {
  players: Player[];
  /** true — section qobiq'siz (alohida sahifada SubpageShell beradi) */
  bare?: boolean;
}

export default function Squad({ players, bare }: Props) {
  const [pos, setPos] = useState<Position | "all">("all");
  const [showAcademy, setShowAcademy] = useState(false);

  const byPosition = pos === "all" ? players : players.filter((p) => p.pos === pos);
  const first = byPosition.filter((p) => !p.isAcademy);
  const academy = byPosition.filter((p) => p.isAcademy);

  const content = (
    <>
      <div className={`filters${bare ? "" : " reveal"}`}>
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
              <GraduationCap size={18} aria-hidden="true" />
              Akademiya va zaxira
              <b>{academy.length}</b>
            </span>
            <span className="squad-academy__arrow">
              {showAcademy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
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
    </>
  );

  if (bare) return <div>{content}</div>;

  return (
    <section className="section" id="squad">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Jamoa tarkibi</h2>
          <p className="section__sub">
            Qizil futbolkani kiyib maydonga chiqadigan o&apos;yinchilar
          </p>
        </div>
        {content}
        <p className="section-more reveal">
          <Link href="/squad">Tarkib va futbolchilar statistikasi →</Link>
        </p>
      </div>
    </section>
  );
}
