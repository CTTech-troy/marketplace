import Link from "next/link";
export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-main">
    <div><Link href="/" className="wordmark footer-wordmark">market<span>.</span></Link><p className="footer-note">A storefront prototype demonstrating an accessible, search-friendly shopping experience.</p></div>
    <div className="footer-links"><Link href="/search">Shop</Link><Link href="/cart">Shopping bag</Link><Link href="/#about">About this demo</Link></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} Marketplace Demo</span><span>Built with Next.js App Router</span></div></footer>;
}