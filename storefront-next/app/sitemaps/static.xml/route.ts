import { NextResponse } from "next/server";
import { getCategories } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;
function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
export async function GET() {
  const urls = [absoluteUrl("/"), ...getCategories().map((category) => absoluteUrl(`/categories/${category.slug}`))];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join("\n")}\n</urlset>`;
  return new NextResponse(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}