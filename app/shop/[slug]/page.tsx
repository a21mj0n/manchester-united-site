import { ImageOff } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OrderForm from "@/components/shop/OrderForm";
import SubpageShell from "@/components/SubpageShell";
import { formatSum } from "@/lib/donate";
import { getProductBySlug, parseSizes } from "@/lib/shop";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Mahsulot topilmadi — Red Devils Uzbekistan" };
  return {
    title: `${product.name} — Do'kon — Red Devils Uzbekistan`,
    description: product.description.slice(0, 160) || `${product.name}, ${formatSum(product.price)} so'm`,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProductBySlug((await params).slug);
  if (!product || !product.active) notFound();

  const sizes = parseSizes(product.sizes);

  return (
    <SubpageShell title={product.name} backHref="/shop">
      <div className="product-page">
        <div className="product-page__media">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="product-page__noimg">
              <ImageOff size={36} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="product-page__info">
          <strong className="product-page__price">{formatSum(product.price)} so'm</strong>
          {sizes.length > 0 && (
            <p className="product-page__sizes">
              O'lchamlar: {sizes.join(", ")}
            </p>
          )}
          {product.description && (
            <p className="product-page__desc">{product.description}</p>
          )}
          <OrderForm productId={product.id} sizes={sizes} />
        </div>
      </div>
    </SubpageShell>
  );
}
