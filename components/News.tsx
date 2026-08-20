import type { NewsItem } from "@/lib/news-defaults";

function tagClass(color: string): string {
  if (color === "red") return "tag tag--red";
  if (color === "gold") return "tag tag--gold";
  return "tag";
}

/**
 * Tashqi manbadan olingan xabarlarda faqat sarlavha va qisqa tavsif
 * ko'rsatiladi — karta bosilganda asl maqolaga o'tiladi. Maqola matni
 * ko'chirilmaydi.
 */
export default function News({ items }: { items: NewsItem[] }) {
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
          {items.map((n, i) => {
            const inner = (
              <>
                <div className={`news__img news__img--${n.image}`} />
                <div className="news__body">
                  <span className={tagClass(n.tagColor)}>{n.tag}</span>
                  <h3>{n.title}</h3>
                  <p>{n.excerpt}</p>
                  {n.sourceUrl ? (
                    <span className="news__source">
                      {n.sourceName} · asl maqolaga o'tish ↗
                    </span>
                  ) : (
                    n.meta && <span className="news__date">{n.meta}</span>
                  )}
                </div>
              </>
            );

            const className = `news${n.featured && allowFeatured ? " news--big" : ""} reveal`;

            return n.sourceUrl ? (
              <a
                key={`${n.title}-${i}`}
                className={`${className} news--link`}
                href={n.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {inner}
              </a>
            ) : (
              <article key={`${n.title}-${i}`} className={className}>
                {inner}
              </article>
            );
          })}
        </div>

        <p className="news__note reveal">
          Tashqi manbalardan olingan xabarlarda sarlavha va havola ko'rsatiladi —
          maqolaning o'zi asl saytda o'qiladi.
        </p>
      </div>
    </section>
  );
}
