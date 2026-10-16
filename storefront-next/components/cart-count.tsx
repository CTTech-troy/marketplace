"use client";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
export function CartCount() {
  const { itemCount, ready } = useCart();
  return <Link className="cart-link" href="/cart" aria-label={ready ? `Cart, ${itemCount} items` : "Cart"}>Bag <span className="cart-count">{ready ? itemCount : "–"}</span></Link>;
}