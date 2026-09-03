import type { Metadata } from "next";

import AdminNav from "@/components/admin/AdminNav";
import ShopManager from "@/components/admin/ShopManager";
import { getAllProducts } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Do'kon — Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminShopPage() {
  const products = await getAllProducts();

  return (
    <main className="admin">
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Do'kon</h1>
          <p className="admin__sub">
            Mahsulotlar. Sotuvdagilar /shop sahifasida va bosh sahifada ko'rinadi.
          </p>
        </div>
        <AdminNav current="/admin/shop" />
      </header>

      <ShopManager
        products={products.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          price: p.price,
          sizes: p.sizes,
          image: p.image,
          active: p.active,
          sortOrder: p.sortOrder,
        }))}
      />
    </main>
  );
}
