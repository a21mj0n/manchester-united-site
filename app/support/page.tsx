import {
  Cloud,
  CreditCard,
  Database,
  ExternalLink,
  Globe,
  HandHeart,
  Megaphone,
  Send,
  Share2,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import SubpageShell from "@/components/SubpageShell";
import CopyButton from "@/components/support/CopyButton";
import {
  currentMonthUz,
  formatCard,
  formatSum,
  getDonateSettings,
  hasPaymentMethod,
} from "@/lib/donate";

export const metadata: Metadata = {
  title: "Saytni qo'llab-quvvatlash — Red Devils Uzbekistan",
  description:
    "Red Devils Uzbekistan sayti muxlislar hisobidan ishlaydi. Server va ma'lumotlar xarajatini qoplashga yordam bering.",
};

// Rekvizitlar va yig'ilgan summa bazadan o'qiladi — admin o'zgartirsa darhol ko'rinsin
export const dynamic = "force-dynamic";

const COSTS = [
  {
    Icon: Cloud,
    title: "Server",
    text: "Sayt kechayu kunduz ishlab turishi uchun oylik VPS ijarasi.",
  },
  {
    Icon: Database,
    title: "Ma'lumotlar API",
    text: "O'yinlar, jadval va statistika pullik manbadan har kuni yangilanadi.",
  },
  {
    Icon: Globe,
    title: "Domen va xizmatlar",
    text: "Domen, SSL sertifikat va bildirishnomalar uchun kichik xarajatlar.",
  },
];

export default async function SupportPage() {
  const s = await getDonateSettings();
  const hasGoal = s.goal > 0;
  const percent = hasGoal ? Math.min(100, Math.round((s.collected / s.goal) * 100)) : 0;
  const month = currentMonthUz();

  return (
    <SubpageShell
      title="Saytni qo'llab-quvvatlash"
      sub="Bu sayt reklama va homiysiz, muxlislar hisobidan ishlaydi. Har bir hissa serverni yana bir oy yoqiq saqlaydi."
    >
      {hasGoal && (
        <section className="support__goal" aria-label="Oylik maqsad">
          <div className="support__goal-head">
            <span className="tag tag--gold">{month} oyi</span>
            <span className="support__percent">{percent}%</span>
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
          <div className="support__nums">
            <span>
              Yig'ildi: <b>{formatSum(s.collected)} so'm</b>
            </span>
            <span>
              Maqsad: <b>{formatSum(s.goal)} so'm</b>
            </span>
          </div>
        </section>
      )}

      <h2 className="support__h2">Pul nimaga ketadi</h2>
      <div className="watch__grid">
        {COSTS.map(({ Icon, title, text }) => (
          <div key={title} className="watch-card">
            <div className="watch-card__head">
              <h3>{title}</h3>
              <Icon size={20} aria-hidden="true" />
            </div>
            <p>{text}</p>
          </div>
        ))}
      </div>

      <h2 className="support__h2">To'lov usullari</h2>
      {hasPaymentMethod(s) ? (
        <div className="watch__grid">
          {s.paymeUrl && (
            <div className="watch-card pay-card">
              <div className="watch-card__head">
                <h3>Payme</h3>
                <CreditCard size={20} aria-hidden="true" />
              </div>
              <p>Payme ilovasi yoki sayti orqali istalgan summa.</p>
              <a
                href={s.paymeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
              >
                <ExternalLink size={16} aria-hidden="true" />
                Payme orqali
              </a>
            </div>
          )}

          {s.clickUrl && (
            <div className="watch-card pay-card">
              <div className="watch-card__head">
                <h3>Click</h3>
                <CreditCard size={20} aria-hidden="true" />
              </div>
              <p>Click ilovasi yoki sayti orqali istalgan summa.</p>
              <a
                href={s.clickUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
              >
                <ExternalLink size={16} aria-hidden="true" />
                Click orqali
              </a>
            </div>
          )}

          {s.cardNumber && (
            <div className="watch-card pay-card">
              <div className="watch-card__head">
                <h3>Karta raqami</h3>
                <CreditCard size={20} aria-hidden="true" />
              </div>
              <p>Uzcard yoki Humo kartasidan o'tkazma.</p>
              <div className="pay-card__number">{formatCard(s.cardNumber)}</div>
              {s.cardOwner && <p className="pay-card__owner">{s.cardOwner}</p>}
              <CopyButton text={s.cardNumber.replace(/\D/g, "")} label="Raqamni nusxalash" />
            </div>
          )}

          {s.telegramUrl && (
            <div className="watch-card pay-card">
              <div className="watch-card__head">
                <h3>Telegram</h3>
                <Send size={20} aria-hidden="true" />
              </div>
              <p>Savol yoki boshqa usulda yordam bermoqchi bo'lsangiz yozing.</p>
              <a
                href={s.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
              >
                <Send size={16} aria-hidden="true" />
                Telegramda yozish
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          To'lov rekvizitlari tez orada joylanadi. Hozircha saytni do'stlaringiz
          bilan ulashing.
        </div>
      )}

      <h2 className="support__h2">Pulsiz ham yordam bera olasiz</h2>
      <div className="watch__grid">
        <div className="watch-card">
          <div className="watch-card__head">
            <h3>Ulashing</h3>
            <Share2 size={20} aria-hidden="true" />
          </div>
          <p>Saytni muxlis do'stlaringizga va guruhlaringizga yuboring.</p>
        </div>
        <div className="watch-card">
          <div className="watch-card__head">
            <h3>Fan-klubga qo'shiling</h3>
            <Users size={20} aria-hidden="true" />
          </div>
          <p>Uchrashuvlar va turnirlarda ishtirok eting.</p>
          <Link href="/#fanclub" className="watch-card__link">
            Ariza qoldirish
          </Link>
        </div>
        <div className="watch-card">
          <div className="watch-card__head">
            <h3>Homiy bo'ling</h3>
            <Megaphone size={20} aria-hidden="true" />
          </div>
          <p>Biznesingizni muxlislar jamoasiga tanishtiring. Bog'lanish uchun Telegramda yozing.</p>
        </div>
      </div>

      <p className="note support__note">
        <HandHeart size={14} aria-hidden="true" /> Hissa ixtiyoriy va hech qanday
        xizmat evaziga emas. Yig'ilgan mablag' faqat sayt xarajatlariga sarflanadi,
        hisobot shu sahifada ko'rsatiladi.
      </p>
    </SubpageShell>
  );
}
