import type { NewsItem } from "@/lib/news-defaults";

function tagClass(color: string): string {
  if (color === "red") return "tag tag--red";
  if (color === "gold") return "tag tag--gold";
  return "tag";
}

export default function News({ items }: { items: NewsItem[] }) {
  // Katta karta ikki ustunni egallaydi — yozuv kam bo'lsa
  // panjarada bo'sh joy qolib ketmasligi uchun oddiy o'lchamda beramiz
  const allowFeatured = items.length >= 3;

  return (
    <section className="section" id="news">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Yangiliklar</h2>
          <p className="section__sub">
            Klub hayotidan so'nggi xabarlar va fan-klub e'lonlari
          </p>
        </div>

        <div className="news-grid">
          {items.map((n, i) => (
            <article
              key={`${n.title}-${i}`}
              className={`news${n.featured && allowFeatured ? " news--big" : ""} reveal`}
            >
              <div className={`news__img news__img--${n.image}`} />
              <div className="news__body">
                <span className={tagClass(n.tagColor)}>{n.tag}</span>
                <h3>{n.title}</h3>
                <p>{n.excerpt}</p>
                {n.meta && <span className="news__date">{n.meta}</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
