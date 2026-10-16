import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return <article className="product-card">
    <Link className="product-image-wrap" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
      <Image src={product.image} alt={product.name} fill priority={priority} sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 23vw" className="product-image" />
      {!product.inStock && <span className="stock-label">Sold out</span>}
    </Link>
    <div className="product-card-info"><div><Link href={`/products/${product.slug}`} className="product-name">{product.name}</Link><p className="product-category">{product.category}</p></div><p className="product-price">{formatPrice(product.price, product.currency)}</p></div>
    <AddToCartButton product={product} fullWidth />
  </article>;
}