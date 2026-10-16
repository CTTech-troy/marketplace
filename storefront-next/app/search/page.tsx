import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product-grid";
import { getCategories, listProducts } from "@/lib/catalog";
import { safeInteger } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Search and filter the Marketplace catalogue.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" }
};

type Query = Promise<{ q?: string | string[]; category?: string | string[]; sort?: string | string[]; minPrice?: string | string[]; maxPrice?: string | string[]; page?: string | string[] }>;

export default async function SearchPage({ searchParams }: { searchParams: Query }) {
  const params = await searchParams;
  const value = (item?: string | string[]) => Array.isArray(item) ? item[0] : item;
  const q = value(params.q)?.trim().slice(0, 120);
  const category = value(params.category);
  const sort = value(params.sort);
  const minPriceValue = value(params.minPrice);
  const maxPriceValue = value(params.maxPrice);
  const page = Math.max(1, safeInteger(value(params.page), 1));
  const categoryList = await getCategories();
  const minPrice = minPriceValue && Number.isFinite(Number(minPriceValue)) ? Math.max(0, Number(minPriceValue)) : undefined;
  const maxPrice = maxPriceValue && Number.isFinite(Number(maxPriceValue)) ? Math.max(0, Number(maxPriceValue)) : undefined;
  const result = await listProducts({
    search: q,
    category: categoryList.some((item) => item.slug === category) ? category : undefined,
    sort: ["newest", "price-asc", "price-desc", "name"].includes(sort ?? "") ? sort : "newest",
    minPrice, maxPrice, page, pageSize: 12
  });
  const queryString = new URLSearchParams();
  if (q) queryString.set("q", q);
  if (category) queryString.set("category", category);
  if (sort) queryString.set("sort", sort);
  if (minPriceValue) queryString.set("minPrice", minPriceValue);
  if (maxPriceValue) queryString.set("maxPrice", maxPriceValue);
  function paginationUrl(nextPage: number) {
    const next = new URLSearchParams(queryString);
    next.set("page", String(nextPage));
    return `/search?${next.toString()}`;
  }

  return <section className="search-page section-block">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Shop all</span></div>
    <div className="search-heading"><div><p className="eyebrow">TAKE A LOOK AROUND</p><h1>Find your <em>everyday.</em></h1><p>Search the collection, narrow it down, and find what works for you.</p></div></div>
    <form className="filter-panel" action="/search" method="get">
      <label className="search-field"><span>Search products</span><input type="search" name="q" placeholder="Try “bag” or “desk”" defaultValue={q ?? ""} maxLength={120} /></label>
      <label><span>Category</span><select name="category" defaultValue={category ?? ""}><option value="">All categories</option>{categoryList.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label><span>Sort by</span><select name="sort" defaultValue={sort ?? "newest"}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name</option></select></label>
      <label><span>Min price (NGN)</span><input type="number" name="minPrice" min="0" inputMode="numeric" placeholder="0" defaultValue={minPriceValue ?? ""} /></label>
      <label><span>Max price (NGN)</span><input type="number" name="maxPrice" min="0" inputMode="numeric" placeholder="No limit" defaultValue={maxPriceValue ?? ""} /></label>
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