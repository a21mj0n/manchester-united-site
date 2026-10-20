import Image from "next/image";
import { SOCIAL_LINKS } from "@/config/social";
import SocialIcon from "./icons/SocialIcon";

const LINKS = [
  { href: "#news", label: "Yangiliklar" },
  { href: "#matches", label: "O'yinlar" },
  { href: "#squad", label: "Tarkib" },
  { href: "#history", label: "Tarix" },
  { href: "#fanclub", label: "Fan-klub" },
  { href: "/shop", label: "Do'kon" },
  { href: "/support", label: "Qo'llab-quvvatlash" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Image
            src="/assets/crest.svg"
            alt=""
            width={52}
            height={52}
            className="footer__crest"
            style={{ height: "auto" }}
          />
          <div>
            <strong>RED DEVILS UZBEKISTAN</strong>
            <p>O&apos;zbekistondagi Manchester United muxlislari jamoasi</p>
          </div>
        </div>

        <nav className="footer__nav">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="footer__social">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={`${s.label} — ${s.handle}`}
            >
              <SocialIcon network={s.key} size={18} />
            </a>
          ))}
        </div>
      </div>

      <div className="container footer__bottom">
        <p>
          © {new Date().getFullYear()} Red Devils Uzbekistan — muxlislar tomonidan
          yaratilgan.
        </p>
        <p className="footer__disc">
          Rasmiy bo&apos;lmagan sayt. Manchester United FC bilan bog&apos;liq emas.
          Saytdagi statistika va o&apos;yin jadvali tashqi ochiq manbalardan olinadi.
        </p>
      </div>
    </footer>
  );
}
