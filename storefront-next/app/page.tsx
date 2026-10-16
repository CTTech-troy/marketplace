import Link from "next/link";
import { listProducts, categories } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 60;

export default async function HomePage() {
  const featured = await listProducts({ page: 1, pageSize: 8, sort: "newest" });
  const accessories = await listProducts({ page: 1, pageSize: 3, category: "accessories" });
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "market.",
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/search?q={search_term_string}") },
      "query-input": "required name=search_term_string"
    }
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }} />
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">GOOD THINGS, WELL MADE</p>
        <h1>Little things.<br /><em>Better days.</em></h1>
        <p className="hero-intro">Considered essentials for your everyday routine. Useful objects, honest details, and less noise.</p>
        <div className="hero-actions"><Link href="/search" className="button">Explore the collection <span aria-hidden="true">↗</span></Link><Link href="/categories/accessories" className="text-link">Shop accessories</Link></div>
        <div className="hero-proof"><span className="proof-dot" /> A simple, thoughtful way to shop online</div>
      </div>
      <div className="hero-visual" aria-label="A curated collection of everyday objects">
        <div className="hero-art hero-art-one" /><div className="hero-art hero-art-two" />
        <div className="hero-sticker"><span>Objects for</span><strong>everyday</strong><span>living</span></div>
        <div className="hero-caption"><span>01 / THE ESSENTIALS</span><span>Curated with care</span></div>
      </div>
    </section>
    <section className="benefit-strip" aria-label="Store benefits">
      <div><span className="benefit-icon">✳</span><span>Considered essentials</span></div><div><span className="benefit-icon">◇</span><span>Simple, honest details</span></div><div><span className="benefit-icon">↗</span><span>Easy everyday choices</span></div>
    </section>
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">FIND YOUR EVERYDAY</p><h2>Shop by collection</h2></div><Link href="/search" className="text-link">Browse all products ↗</Link></div>
      <div className="category-grid">{categories.map((category, index) => <Link href={`/categories/${category.slug}`} className={`category-tile tile-${index + 1}`} key={category.slug}><span className="category-index">0{index + 1}</span><span className="category-tile-bottom"><strong>{category.name}</strong><span>Explore collection ↗</span></span></Link>)}</div>
    </section>
    <section className="section-block product-section">
      <div className="section-heading"><div><p className="eyebrow">THE CURRENT EDIT</p><h2>Everyday favourites</h2><p className="section-intro">Good design earns its place by being useful.</p></div><Link href="/search?sort=newest" className="text-link">See everything ↗</Link></div>
      <ProductGrid products={featured.items} />
    </section>
    <section className="editorial-banner" id="about">
      <div className="editorial-image"><div className="editorial-roundel">MAKE<br />ROOM<br />FOR GOOD.</div></div>
      <div className="editorial-copy"><p className="eyebrow">A MORE THOUGHTFUL EDIT</p><h2>Less clutter.<br /><em>More character.</em></h2><p>We believe the things you use every day should feel intentional. This storefront demo explores that idea through a clear catalogue, quick browsing and a checkout flow ready for a real commerce API.</p><Link href="/categories/accessories" className="button">Explore the edit <span aria-hidden="true">↗</span></Link></div>
    </section>
    <section className="section-block compact-section">
      <div className="section-heading"><div><p className="eyebrow">SMALL DETAILS, BIG DIFFERENCE</p><h2>A few things we like</h2></div><Link href="/categories/accessories" className="text-link">Shop accessories ↗</Link></div>
      <ProductGrid products={accessories.items} />
    </section>
  </>;
}