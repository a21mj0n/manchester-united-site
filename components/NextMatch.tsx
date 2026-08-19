"use client";

import { useEffect, useState } from "react";

import { getNextKickoff } from "@/lib/schedule";

const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  /** ISO sana — server komponentidan keladi */
  kickoff: string;
}

export default function NextMatch({ kickoff }: Props) {
  // Serverdan kelgan sana boshlang'ich qiymat (SSR/SEO uchun),
  // klientda esa qayta hisoblanadi — sahifa statik keshlansa ham
  // sanoq har doim to'g'ri qoladi.
  const [target, setTarget] = useState(() => new Date(kickoff));
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    setTarget(getNextKickoff());
  }, []);

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
          <div className="next__label">Keyingi o'yin · Premer-liga</div>

          <div className="next__teams">
            <div className="team">
              <div className="team__logo team__logo--mu">MU</div>
              <span>Manchester United</span>
            </div>
            <div className="next__vs">
              <span>VS</span>
              <small suppressHydrationWarning>
                {target.getDate()}-{MONTHS[target.getMonth()]} ·{" "}
                {pad(target.getHours())}:{pad(target.getMinutes())}
              </small>
            </div>
            <div className="team">
              <div className="team__logo">ARS</div>
              <span>Arsenal</span>
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

          <p className="next__note">📍 Old Trafford · mahalliy vaqt bilan</p>
        </div>
      </div>
    </section>
  );
}
