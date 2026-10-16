import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canIndexSite, getSiteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "market. | Everyday goods, considered", template: "%s | market." },
  description: "Discover considered everyday goods across apparel, accessories, home and technology.",
  applicationName: "Marketplace Demo",
  robots: canIndexSite()
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "market.",
    title: "market. | Everyday goods, considered",
    description: "Discover considered everyday goods across apparel, accessories, home and technology."
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f5f0" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-NG"><body><a className="skip-link" href="#main-content">Skip to content</a><CartProvider><SiteHeader /><main id="main-content">{children}</main><SiteFooter /></CartProvider></body></html>;
}