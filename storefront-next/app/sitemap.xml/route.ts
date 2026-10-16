import { NextResponse } from "next/server";
import { getDemoCatalogCount } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;
const PRODUCTS_PER_SITEMAP = 1000;

async function getProductCount(): Promise<number> {
  const base = process.env.COMMERCE_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return getDemoCatalogCount();
  const url = new URL(`${base}/store/products`);
  url.searchParams.set("page", "1");
  url.searchParams.set("pageSize", "1");
  const response = await fetch(url, { next: { revalidate: 3600, tags: ["catalog"] } });
  if (!response.ok) throw new Error("Could not load product count for sitemap");
  const payload = await response.json() as { total?: unknown; items?: unknown[]; products?: unknown[] };
  const total = Number(payload.total ?? (Array.isArray(payload.items) ? payload.items.length : Array.isArray(payload.products) ? payload.products.length : 0));
  if (!Number.isFinite(total) || total < 0) throw new Error("Catalog returned an invalid product count");
  return total;
}

export async function GET() {
  try {
    const count = await getProductCount();
    const productPages = Math.ceil(count / PRODUCTS_PER_SITEMAP);
    const urls = [absoluteUrl("/sitemaps/static.xml"), ...Array.from({ length: productPages }, (_, index) => absoluteUrl(`/sitemaps/products/${index + 1}.xml`))];
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join("\n")}\n</sitemapindex>`;
    return new NextResponse(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return new NextResponse("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}