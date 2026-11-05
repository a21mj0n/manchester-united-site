import { ArrowRight, Heart, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

import { TAPS_AMOUNTS, TAPS_URL } from "@/config/donate";
import { currentMonthUz, formatSum, getDonateSettings } from "@/lib/donate";

/**
 * Bosh sahifadagi donat bloki — Taps havolasiga olib boradi.
 * Admin oylik maqsad qo'ygan bo'lsa progress ham ko'rinadi.
 */
export default async function DonateBanner() {
  const s = await getDonateSettings();
  const hasGoal = s.goal > 0;
  const percent = hasGoal ? Math.min(100, Math.round((s.collected / s.goal) * 100)) : 0;

  return (
    <section className="section donate" id="donate">
      <div className="container">
        <div className="donate__card reveal">
          <div className="donate__glow" aria-hidden="true" />

          <div className="donate__content">
            <span className="tag tag--gold donate__tag">
              <Heart size={12} aria-hidden="true" /> Muxlislar hisobidan
            </span>
            <h2 className="donate__title">
              Saytni <span>qo&apos;llab-quvvatlang</span>
            </h2>
            <p className="donate__text">
              Red Devils Uzbekistan reklamasiz va homiysiz ishlaydi. Server, o&apos;yin
              ma&apos;lumotlari va domen — hammasi muxlislar hissasi bilan. Bir piyola
              choy puli ham saytni yana bir kun yoqiq saqlaydi.
            </p>

            <div className="donate__amounts" aria-label="Tayyor summalar">
              {TAPS_AMOUNTS.map((a) => (
                <a
                  key={a}
                  href={TAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donate__chip"
                >
                  {formatSum(a)} <small>so&apos;m</small>
                </a>
              ))}
            </div>

            <div className="donate__actions">
              <a
                href={TAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary donate__btn"
              >
                <Heart size={18} aria-hidden="true" />
                Donat qilish
                <ArrowRight size={16} aria-hidden="true" className="donate__arrow" />
              </a>
              <Link href="/support" className="btn btn--ghost">
                Boshqa usullar
              </Link>
            </div>

            <ul className="donate__trust">
              <li>
                <Zap size={14} aria-hidden="true" /> Taps orqali, 30 soniyada
              </li>
              <li>
                <ShieldCheck size={14} aria-hidden="true" /> Uzcard, Humo, Visa
              </li>
            </ul>
          </div>

          <div className="donate__side">
            <div className="donate__heart" aria-hidden="true">
              <Heart size={72} strokeWidth={1.4} />
            </div>
            {hasGoal ? (
              <div className="donate__goal">
                <div className="donate__goal-head">
                  <span>{currentMonthUz()} maqsadi</span>
                  <b>{percent}%</b>
                </div>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={s.goal}
                  aria-valuenow={s.collected}
                >
                  <div className="progress__bar" style={{ width: `${percent}%` }} />
                </div>
                <small>
                  {formatSum(s.collected)} / {formatSum(s.goal)} so&apos;m
                </small>
              </div>
            ) : (
              <p className="donate__side-text">
                Har bir hissa saytning oylik hisobotida ko&apos;rsatiladi.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
