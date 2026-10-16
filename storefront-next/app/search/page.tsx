import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product-grid";
import { categories, listProducts } from "@/lib/catalog";
import { safeInteger } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Search and filter the Marketplace catalogue.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" }
};

type Query = Promise<{ q?: string; category?: string; sort?: string; minPrice?: string; maxPrice?: string; page?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: Query }) {
  const params = await searchParams;
  const page = Math.max(1, safeInteger(params.page, 1));
  const minPrice = params.minPrice && Number.isFinite(Number(params.minPrice)) ? Math.max(0, Number(params.minPrice)) : undefined;
  const maxPrice = params.maxPrice && Number.isFinite(Number(params.maxPrice)) ? Math.max(0, Number(params.maxPrice)) : undefined;
  const result = await listProducts({
    search: params.q?.trim().slice(0, 120),
    category: categories.some((item) => item.slug === params.category) ? params.category : undefined,
    sort: ["newest", "price-asc", "price-desc", "name"].includes(params.sort ?? "") ? params.sort : "newest",
    minPrice, maxPrice, page, pageSize: 12
  });
  const queryString = new URLSearchParams();
  if (params.q) queryString.set("q", params.q);
  if (params.category) queryString.set("category", params.category);
  if (params.sort) queryString.set("sort", params.sort);
  if (params.minPrice) queryString.set("minPrice", params.minPrice);
  if (params.maxPrice) queryString.set("maxPrice", params.maxPrice);
  function paginationUrl(nextPage: number) {
    const next = new URLSearchParams(queryString);
    next.set("page", String(nextPage));
    return `/search?${next.toString()}`;
  }

  return <section className="search-page section-block">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Shop all</span></div>
    <div className="search-heading"><div><p className="eyebrow">TAKE A LOOK AROUND</p><h1>Find your <em>everyday.</em></h1><p>Search the collection, narrow it down, and find what works for you.</p></div></div>
    <form className="filter-panel" action="/search" method="get">
      <label className="search-field"><span>Search products</span><input type="search" name="q" placeholder="Try “bag” or “desk”" defaultValue={params.q ?? ""} maxLength={120} /></label>
      <label><span>Category</span><select name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label><span>Sort by</span><select name="sort" defaultValue={params.sort ?? "newest"}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name</option></select></label>
      <label><span>Min price (NGN)</span><input type="number" name="minPrice" min="0" inputMode="numeric" placeholder="0" defaultValue={params.minPrice ?? ""} /></label>
      <label><span>Max price (NGN)</span><input type="number" name="maxPrice" min="0" inputMode="numeric" placeholder="No limit" defaultValue={params.maxPrice ?? ""} /></label>
      <div className="filter-actions"><button className="button" type="submit">Apply filters</button><Link href="/search" className="text-link">Clear all</Link></div>
    </form>
    <div className="result-line"><span>{result.total} result{result.total === 1 ? "" : "s"}</span><span>Page {result.page} of {result.totalPages}</span></div>
    <ProductGrid products={result.items} />
    {result.totalPages > 1 && <nav className="pagination" aria-label="Search result pages">
      {page > 1 && <Link href={paginationUrl(page - 1)}>← Previous</Link>}
      <span>Page {page} / {result.totalPages}</span>
      {page < result.totalPages && <Link href={paginationUrl(page + 1)}>Next →</Link>}
    </nav>}
  </section>;
}