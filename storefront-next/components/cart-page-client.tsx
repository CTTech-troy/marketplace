"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/utils";

export function CartPageClient() {
  const { items, ready, subtotal, setQuantity, removeItem } = useCart();
  if (!ready) return <section className="message-page"><p className="eyebrow">YOUR BAG</p><h1>Loading your bag...</h1></section>;
  if (!items.length) return <section className="message-page"><p className="eyebrow">YOUR BAG / 00</p><h1>Nothing here <em>yet.</em></h1><p>Find something useful for your everyday routine.</p><Link className="button" href="/search">Explore the collection</Link></section>;
  return <section className="section-block cart-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Your bag</span></div>
    <div className="cart-title"><p className="eyebrow">YOUR BAG / {String(items.length).padStart(2, "0")}</p><h1>Worth keeping.</h1><p>Review your items before checkout.</p></div>
    <div className="cart-layout">
      <div className="cart-lines">{items.map((item) => <article className="cart-line" key={item.id}>
        <Link className="cart-line-image" href={`/products/${item.slug}`}><Image src={item.image} alt={item.name} fill sizes="112px" /></Link>
        <div className="cart-line-main"><Link className="cart-line-name" href={`/products/${item.slug}`}>{item.name}</Link><span className="product-category">{item.inStock ? "In stock" : "Availability needs confirmation"}</span>
          <div className="quantity-control"><button aria-label={`Decrease ${item.name} quantity`} type="button" onClick={() => setQuantity(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.name} quantity`} type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= 10}>+</button></div>
        </div>
        <div className="cart-line-right"><strong>{formatPrice(item.price * item.quantity, item.currency)}</strong><button type="button" className="remove-link" onClick={() => removeItem(item.id)}>Remove</button></div>
      </article>)}</div>
      <aside className="order-summary"><p className="eyebrow">ORDER SUMMARY</p><div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><div className="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Estimated subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <Link href="/checkout" className="button button-block">Continue to checkout <span aria-hidden="true">↗</span></Link><p className="checkout-note">The server must re-check current product prices and stock before creating an order.</p><Link href="/search" className="text-link">Continue shopping</Link>
      </aside>
    </div>
  </section>;
}