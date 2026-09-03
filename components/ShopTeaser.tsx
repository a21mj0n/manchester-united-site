import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import ProductCard from "@/components/shop/ProductCard";
import { getActiveProducts } from "@/lib/shop";

/** Bosh sahifadagi do'kon bloki. Mahsulot bo'lmasa umuman chiqmaydi. */
export default async function ShopTeaser() {
  const products = await getActiveProducts(3);
  if (products.length === 0) return null;

  return (
    <section className="section shop-teaser" id="shop">
      <div className="container">
        <div className="section__head reveal">
          <span className="tag tag--gold">
            <ShoppingBag size={12} aria-hidden="true" /> Atributika
          </span>
          <h2 className="section__title">Do'kon</h2>
          <p className="section__sub">
            Fan-klubning o'z brendidagi sharf, futbolka va kepka. Oldindan buyurtma.
          </p>
        </div>

        <div className="product-grid reveal">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              price={p.price}
              sizes={p.sizes}
              image={p.image}
            />
          ))}
        </div>

        <div className="section-more">
          <Link href="/shop">Barcha mahsulotlar →</Link>
        </div>
      </div>
    </section>
  );
}
