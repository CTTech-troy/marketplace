import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart-page-client";
export const metadata: Metadata = { title: "Your shopping bag", robots: { index: false, follow: false } };
export default function CartPage() { return <CartPageClient />; }