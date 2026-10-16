import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getCategory } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { absoluteUrl, canIndexSite } from "@/lib/seo";

type RouteProps = { params: Promise<{ slug: string }> };
export const revalidate = 300;

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  const canonical = absoluteUrl(`/products/${product.slug}`);
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical },
    robots: canIndexSite() ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", title: product.name, description: product.description, url: canonical, images: [{ url: product.image, alt: product.name }] }
  };
}

export default async function ProductPage({ params }: RouteProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const category = getCategory(product.category);
  const productUrl = absoluteUrl(`/products/${product.slug}`);
  const productJsonLd = {
    "@context": "https://schema.org", "@type": "Product",
    name: product.name, description: product.description, sku: product.sku,
    image: [product.image], category: category?.name ?? product.category, url: productUrl,
    offers: {
      "@type": "Offer", url: productUrl, priceCurrency: product.currency,
      price: product.price.toFixed(0),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      ...(category ? [{ "@type": "ListItem", position: 2, name: category.name, item: absoluteUrl(`/categories/${category.slug}`) }] : []),
      { "@type": "ListItem", position: category ? 3 : 2, name: product.name, item: productUrl }
    ]
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
    <section className="product-detail">
      <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span>{category && <><Link href={`/categories/${category.slug}`}>{category.name}</Link><span>/</span></>}<span>{product.name}</span></div>
      <div className="product-detail-grid">
        <div className="product-detail-image"><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 56vw" className="detail-image" /></div>
        <div className="product-detail-copy">
          <p className="eyebrow">{category?.name ?? "THE COLLECTION"}</p><h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price, product.currency)}</p>
          <p className="detail-description">{product.description}</p><div className="detail-rule" />
          <div className="detail-meta"><span>Item code</span><strong>{product.sku}</strong></div>
          <div className="detail-meta"><span>Availability</span><strong>{product.inStock ? "In stock" : "Currently unavailable"}</strong></div>
          <AddToCartButton product={product} fullWidth />
          <p className="checkout-note">Prices are shown in NGN. Final availability and prices must be confirmed by the commerce API at checkout.</p>
          <div className="detail-reassurance"><span>◇</span><p><strong>Made for everyday</strong><br />Practical details, considered design, no extra noise.</p></div>
        </div>
      </div>
    </section>
  </>;
}