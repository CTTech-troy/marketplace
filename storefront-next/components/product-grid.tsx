import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <div className="empty-state"><h3>No products found</h3><p>Try another search term or clear your filters.</p></div>;
  return <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}</div>;
}