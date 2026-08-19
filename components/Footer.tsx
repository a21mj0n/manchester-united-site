import Image from "next/image";

const LINKS = [
  { href: "#news", label: "Yangiliklar" },
  { href: "#matches", label: "O'yinlar" },
  { href: "#squad", label: "Tarkib" },
  { href: "#history", label: "Tarix" },
  { href: "#fanclub", label: "Fan-klub" },
];

const SOCIAL = ["TG", "IG", "YT", "X"];

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
          />
          <div>
            <strong>RED DEVILS UZBEKISTAN</strong>
            <p>O'zbekistondagi Manchester United muxlislari jamoasi</p>
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
          {SOCIAL.map((s) => (
            <a key={s} href="#" aria-label={s}>
              {s}
            </a>
          ))}
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} Red Devils Uzbekistan — muxlislar tomonidan yaratilgan.</p>
        <p className="footer__disc">
          Rasmiy bo'lmagan sayt. Manchester United FC bilan bog'liq emas. Saytdagi
          statistika va o'yin jadvali namunaviy (demo) ma'lumotlardir.
        </p>
      </div>
    </footer>
  );
}
