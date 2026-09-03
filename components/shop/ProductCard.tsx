import { ImageOff } from "lucide-react";
import Link from "next/link";

import { formatSum } from "@/lib/donate";
import { parseSizes } from "@/lib/shop-constants";

interface Props {
  slug: string;
  name: string;
  price: number;
  sizes: string;
  image: string | null;
}

export default function ProductCard({ slug, name, price, sizes, image }: Props) {
  const sizeList = parseSizes(sizes);
  return (
    <Link href={`/shop/${slug}`} className="product">
      <div className="product__img">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <ImageOff size={28} aria-hidden="true" />
        )}
      </div>
      <div className="product__body">
        <h3>{name}</h3>
        {sizeList.length > 0 && <span className="product__sizes">{sizeList.join(" · ")}</span>}
        <strong className="product__price">{formatSum(price)} so'm</strong>
      </div>
    </Link>
  );
}
