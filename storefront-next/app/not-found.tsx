import Link from "next/link";
export default function NotFound() {
  return <section className="message-page"><p className="eyebrow">404 / NOT FOUND</p><h1>This page took a wrong turn.</h1><p>The product or page you are looking for may have moved or is no longer available.</p><Link href="/search" className="button">Continue shopping</Link></section>;
}