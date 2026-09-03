import Image from "next/image";
import { Facebook, Instagram, Telegram, XLogo, YouTube } from "./icons/Brands";

const LINKS = [
  { href: "#news", label: "Yangiliklar" },
  { href: "#matches", label: "O'yinlar" },
  { href: "#squad", label: "Tarkib" },
  { href: "#history", label: "Tarix" },
  { href: "#fanclub", label: "Fan-klub" },
  { href: "/shop", label: "Do'kon" },
  { href: "/support", label: "Qo'llab-quvvatlash" },
];

const SOCIAL = [
  { label: "Telegram", href: "#", Icon: Telegram },
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "YouTube", href: "#", Icon: YouTube },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "X", href: "#", Icon: XLogo },
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
          {SOCIAL.map(({ label, href, Icon }) => (
            <a key={label} href={href} aria-label={label} title={label}>
              <Icon size={18} />
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
