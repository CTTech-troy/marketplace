import { NextResponse } from "next/server";
import { listProducts } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;
const PRODUCTS_PER_SITEMAP = 1000;
function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET(_request: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page: pageSegment } = await params;
  const page = Number(pageSegment);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return new NextResponse("Invalid sitemap partition", { status: 404 });

  try {
    let products: { slug: string; updatedAt?: string }[] = [];
    const base = process.env.COMMERCE_API_BASE_URL?.trim().replace(/\/+$/, "");
    if (base) {
      const url = new URL(`${base}/store/products`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(PRODUCTS_PER_SITEMAP));
      url.searchParams.set("fields", "slug,updatedAt");
      const response = await fetch(url, { next: { revalidate: 3600, tags: ["catalog"] } });
      if (!response.ok) throw new Error("Sitemap product fetch failed");
      const data = await response.json() as { items?: typeof products; products?: typeof products };
      products = Array.isArray(data.items) ? data.items : Array.isArray(data.products) ? data.products : [];
    } else if (page === 1) {
      const demo = await listProducts({ page: 1, pageSize: 24 });
      products = demo.items.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${products.filter((p) => typeof p.slug === "string").map((product) => `  <url><loc>${xmlEscape(absoluteUrl(`/products/${product.slug}`))}</loc>${product.updatedAt ? `<lastmod>${xmlEscape(new Date(product.updatedAt).toISOString())}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;
    return new NextResponse(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return new NextResponse("Product sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}