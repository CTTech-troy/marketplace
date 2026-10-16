"use client";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { useCart } from "@/components/cart-provider";
export function AddToCartButton({ product, fullWidth = false }: { product: Product; fullWidth?: boolean }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const unavailable = !product.inStock;
  return <button type="button" className={`button ${fullWidth ? "button-block" : ""} ${unavailable ? "button-disabled" : ""}`} onClick={() => { if (!unavailable) { addItem(product); setAdded(true); } }} disabled={unavailable} aria-live="polite">
    {unavailable ? "Out of stock" : added ? "Added to bag" : "Add to bag"}
  </button>;
}