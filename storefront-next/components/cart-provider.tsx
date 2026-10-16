"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";

export type CartItem = Pick<Product, "id" | "slug" | "name" | "price" | "currency" | "image" | "inStock"> & { quantity: number };
type CartContextValue = {
  items: CartItem[]; ready: boolean; itemCount: number; subtotal: number;
  addItem: (product: Product) => void; setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void; clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "marketplace-next-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((item): item is CartItem =>
            item && typeof item.id === "string" && typeof item.slug === "string" &&
            typeof item.name === "string" && Number.isFinite(item.price) &&
            Number.isInteger(item.quantity) && item.quantity > 0
          ));
        }
      }
    } catch {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be blocked. */ }
    } finally { setReady(true); }
  }, []);
  useEffect(() => {
    if (ready) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
      catch { /* Keep the in-memory cart if storage is unavailable. */ }
    }
  }, [items, ready]);

  const addItem = useCallback((product: Product) => {
    if (!product.inStock) return;
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item);
      return [...current, { id: product.id, slug: product.slug, name: product.name, price: product.price, currency: product.currency, image: product.image, inStock: product.inStock, quantity: 1 }];
    });
  }, []);
  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) { setItems((current) => current.filter((item) => item.id !== id)); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(10, Math.floor(quantity)) } : item));
  }, []);
  const removeItem = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({
    items, ready, itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem, setQuantity, removeItem, clearCart
  }), [items, ready, addItem, setQuantity, removeItem, clearCart]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}