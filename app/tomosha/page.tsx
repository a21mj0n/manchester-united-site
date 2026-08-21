import { ArrowLeft, ExternalLink, MonitorPlay, Tv } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import SecretStream from "@/components/SecretStream";

export const metadata: Metadata = {
  title: "Tomosha qilish — Red Devils Uzbekistan",
  description:
    "Manchester United o'yinlarini tomosha qilish uchun telekanallar va saytlar ro'yxati.",
  robots: { index: false, follow: false },
};

const SOURCES = [
  {
    name: "FUTBOL TV / UZREPORT TV",
    type: "Telekanal",
    url: "https://uzreport.tv",
    desc: "Angliya Premyer-ligasini O'zbekistonda rasmiy translyatsiya qiluvchi milliy telekanallar.",
  },
  {
    name: "Setanta Sports",
    type: "Sayt",
    url: "https://setantasports.com",
    desc: "Mintaqada APL o'yinlarini onlayn ko'rsatadigan pullik striming xizmati.",
  },
  {
    name: "MUTV",
    type: "Telekanal",
    url: "https://www.manutd.com/en/mutv",
    desc: "Klubning rasmiy telekanali: intervyular, obzorlar va yoshlar jamoasi o'yinlari.",
  },
  {
    name: "Sky Sports",
    type: "Sayt",
    url: "https://www.skysports.com/football/teams/manchester-united",
    desc: "O'yin oldi tahlillar, yangiliklar va golli lahzalar (ingliz tilida).",
  },
];

export default function TomoshaPage() {
  return (
    <main className="watch">
      <div className="container">
        <Link href="/#next" className="watch__back">
          <ArrowLeft size={16} aria-hidden="true" />
          Bosh sahifaga qaytish
        </Link>

        <div className="section__head">
          <h1 className="section__title">Tomosha qilish</h1>
          <p className="section__sub">
            Manchester United o'yinlarini quyidagi telekanallar va saytlar
            orqali ko'rishingiz mumkin.
          </p>
        </div>

        <div className="watch__grid">
          {SOURCES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="watch-card"
            >
              <div className="watch-card__head">
                {s.type === "Telekanal" ? (
                  <Tv size={22} aria-hidden="true" />
                ) : (
                  <MonitorPlay size={22} aria-hidden="true" />
                )}
                <span className={`tag${s.type === "Telekanal" ? " tag--red" : ""}`}>
                  {s.type}
                </span>
              </div>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
              <span className="watch-card__link">
                O'tish <ExternalLink size={14} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>

        <SecretStream />

        <p className="note">
          Barcha havolalar tashqi saytlarga olib boradi. Translyatsiya huquqlari
          mavsumga qarab o'zgarishi mumkin.
        </p>
      </div>
    </main>
  );
}
