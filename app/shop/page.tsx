import type { Metadata } from "next";

import ProductCard from "@/components/shop/ProductCard";
import SubpageShell from "@/components/SubpageShell";
import { getActiveProducts } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Do'kon — Red Devils Uzbekistan",
  description:
    "Red Devils Uzbekistan fan-klubi atributikasi: sharf, futbolka, kepka. Oldindan buyurtma.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <SubpageShell
      title="Do'kon"
      sub="Fan-klubning o'z brendidagi atributika. Oldindan buyurtma: buyurtma qoldirasiz, biz bog'lanib to'lov va yetkazishni kelishamiz."
    >
      {products.length === 0 ? (
        <div className="empty-state">
          Hozircha mahsulot yo'q. Tez orada birinchi partiya e'lon qilinadi.
        </div>
      ) : (
        <div className="product-grid">
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
      )}

      <p className="note support__note">
        Mahsulotlar fan-klubning o'z dizayni. Toshkentda uchrashuvda qo'lma-qo'l,
        viloyatlarga pochta orqali yetkaziladi.
      </p>
    </SubpageShell>
  );
}
