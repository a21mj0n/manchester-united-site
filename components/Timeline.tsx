import type { TimelineItem } from "@/lib/types";

export default function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="section" id="history">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Klub tarixi</h2>
          <p className="section__sub">
            1878 yildan bugungi kungacha — Qizil iblislar yo'li
          </p>
        </div>

        <div className="timeline">
          {items.map((t, i) => (
            <div
              className="tl-item reveal"
              key={t.year}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <b>{t.year}</b>
              <h4>{t.title}</h4>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
