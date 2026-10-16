import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategory, listProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { absoluteUrl, canIndexSite } from "@/lib/seo";

type RouteProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Collection not found", robots: { index: false, follow: true } };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: absoluteUrl(`/categories/${category.slug}`) },
    robots: canIndexSite() ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: category.name, description: category.description, url: absoluteUrl(`/categories/${category.slug}`) }
  };
}

export const revalidate = 300;

export default async function CategoryPage({ params }: RouteProps) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const productPage = await listProducts({ category: slug, page: 1, pageSize: 24, sort: "newest" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: absoluteUrl(`/categories/${category.slug}`),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: productPage.total,
      itemListElement: productPage.items.map((product, index) => ({
        "@type": "ListItem", position: index + 1,
        url: absoluteUrl(`/products/${product.slug}`), name: product.name
      }))
    }
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className="collection-hero">
      <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>{category.name}</span></div>
      <p className="eyebrow">THE COLLECTION</p><h1>{category.name}<span>.</span></h1><p>{category.description}</p>
    </section>
    <section className="section-block collection-results">
      <div className="result-line"><span>{productPage.total} items</span><Link href="/search" className="text-link">Search all products ↗</Link></div>
      <ProductGrid products={productPage.items} />
    </section>
  </>;
}