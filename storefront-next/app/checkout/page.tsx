import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default function CheckoutPage() {
  return <section className="section-block checkout-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/cart">Bag</Link><span>/</span><span>Checkout</span></div>
    <div className="checkout-title"><p className="eyebrow">ALMOST THERE</p><h1>Checkout<span>.</span></h1><p>Secure checkout is connected through a server-side adapter, never directly from the browser to payment credentials.</p></div>
    <CheckoutForm />
  </section>;
}