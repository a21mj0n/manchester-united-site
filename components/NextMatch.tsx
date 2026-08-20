"use client";

import { useEffect, useState } from "react";

import { getNextKickoff } from "@/lib/schedule";

const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  /** ISO sana — server komponentidan keladi */
  kickoff: string;
  /** Bazadan kelgan haqiqiy o'yin (bo'lmasa taxminiy sana ishlatiladi) */
  match?: {
    home: string;
    away: string;
    competition: string;
    venue: string | null;
  };
}

function initials(team: string): string {
  const words = team.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0] + (words[2]?.[0] ?? "")).toUpperCase();
  return team.slice(0, 3).toUpperCase();
}

const MU = "Manchester United";

export default function NextMatch({ kickoff, match }: Props) {
  // Serverdan kelgan sana boshlang'ich qiymat (SSR/SEO uchun),
  // klientda esa qayta hisoblanadi — sahifa statik keshlansa ham
  // sanoq har doim to'g'ri qoladi.
  const [target, setTarget] = useState(() => new Date(kickoff));
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    // Haqiqiy o'yin ma'lum bo'lsa qayta hisoblash shart emas
    if (!match) setTarget(getNextKickoff());
  }, [match]);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // Server va klientda bir xil chiqishi uchun birinchi renderda "00"
  const s = left === null ? 0 : Math.floor(left / 1000);
  const cells = [
    { v: Math.floor(s / 86400), label: "kun" },
    { v: Math.floor(s / 3600) % 24, label: "soat" },
    { v: Math.floor(s / 60) % 60, label: "daqiqa" },
    { v: s % 60, label: "soniya" },
  ];

  return (
    <section className="next" id="next">
      <div className="container">
        <div className="next__card reveal">
          <div className="next__label">
            Keyingi o'yin · {match?.competition ?? "Premer-liga"}
          </div>

          <div className="next__teams">
            <div className="team">
              <div
                className={`team__logo${(match?.home ?? MU) === MU ? " team__logo--mu" : ""}`}
              >
                {initials(match?.home ?? MU)}
              </div>
              <span>{match?.home ?? MU}</span>
            </div>
            <div className="next__vs">
              <span>VS</span>
              <small suppressHydrationWarning>
                {target.getDate()}-{MONTHS[target.getMonth()]} ·{" "}
                {pad(target.getHours())}:{pad(target.getMinutes())}
              </small>
            </div>
            <div className="team">
              <div
                className={`team__logo${match?.away === MU ? " team__logo--mu" : ""}`}
              >
                {initials(match?.away ?? "Arsenal")}
              </div>
              <span>{match?.away ?? "Arsenal"}</span>
            </div>
          </div>

          <div className="countdown">
            {cells.map((c) => (
              <div key={c.label}>
                <b suppressHydrationWarning>{pad(c.v)}</b>
                <span>{c.label}</span>
              </div>
            ))}
          </div>

          <p className="next__note">
            📍 {match?.venue || (match?.home === MU ? "Old Trafford" : "Mehmonda")} ·
            Toshkent vaqti bilan
          </p>
        </div>
      </div>
    </section>
  );
}
