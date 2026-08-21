import Image from "next/image";
import type { Legend } from "@/lib/types";

export default function Legends({ items }: { items: Legend[] }) {
  return (
    <section className="section section--dark" id="legends">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Afsonalar</h2>
          <p className="section__sub">
            Old Trafford maydonini abadiy o'ziga bo'ysundirganlar
          </p>
        </div>

        <div className="legends">
          {items.map((l) => (
            <article className="legend reveal" key={l.name}>
              {l.img ? (
                <div className="legend__photo">
                  <Image src={l.img} alt={l.name} width={96} height={96} />
                </div>
              ) : (
                <div className="legend__init">{l.init}</div>
              )}
              <h3>{l.name}</h3>
              <p className="role">{l.role}</p>
              <p>{l.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
