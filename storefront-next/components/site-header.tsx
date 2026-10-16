import Link from "next/link";
import { CartCount } from "@/components/cart-count";
import { getCategories } from "@/lib/catalog";
export async function SiteHeader() {
  const categories = await getCategories();
  return <>
    <div className="announcement">Thoughtful everyday goods. Straightforward shopping.</div>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="wordmark" aria-label="Marketplace home">market<span>.</span></Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/search">Shop all</Link>
        {categories.slice(0, 3).map((category) => <Link key={category.slug} href={`/categories/${category.slug}`}>{category.name}</Link>)}
      </nav>
      <div className="header-actions"><Link className="header-search" href="/search">Search</Link><CartCount /></div>
    </div></header>
  </>;
}