import Image from "next/image";
import Counter from "./Counter";

const STATS = [
  { value: 20, label: "Angliya chempioni" },
  { value: 3, label: "Chempionlar ligasi" },
  { value: 13, label: "FA Kubogi" },
  { value: 1878, label: "Tashkil topgan yil" },
];

const TICKER =
  "GLORY GLORY MAN UNITED ★ THEATRE OF DREAMS ★ OLD TRAFFORD ★ SIR ALEX FERGUSON ★ CLASS OF '92 ★ RED DEVILS UZBEKISTAN ★";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow" />
        <div className="hero__stripes" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <span className="badge reveal">🇺🇿 O'zbekistondagi muxlislar uyushmasi</span>
          <h1 className="hero__title reveal">
            <span className="line">GLORY GLORY</span>
            <span className="line line--accent">MAN UNITED</span>
          </h1>
          <p className="hero__text reveal">
            Old Traffordgacha 5 700 km. Lekin yurak masofani tanimaydi. Bu sayt —
            O'zbekistondagi barcha «Qizil shaytonlar» muxlislari uchun: o'yinlar,
            tarkib, tarix va birgalikda o'tkaziladigan tomoshalar.
          </p>
          <div className="hero__actions reveal">
            <a href="#fanclub" className="btn btn--primary">
              Fan-klubga qo'shilish
            </a>
            <a href="#matches" className="btn btn--ghost">
              Keyingi o'yin
            </a>
          </div>

          <ul className="hero__stats reveal">
            {STATS.map((s) => (
              <li key={s.label}>
                <Counter to={s.value} />
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__visual reveal">
          <Image
            src="/assets/crest.svg"
            alt=""
            width={400}
            height={400}
            className="hero__crest"
            priority
          />
        </div>
      </div>

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          <span>{TICKER}</span>
          <span>{TICKER}</span>
        </div>
      </div>
    </section>
  );
}
