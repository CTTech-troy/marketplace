"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/utils";

type CheckoutResponse = { checkoutUrl?: string; orderReference?: string; message?: string; error?: string };
export function CheckoutForm() {
  const { items, ready, subtotal, clearCart } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!ready || items.length === 0) { setNotice("Your bag is empty. Add an item before checking out."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
          items: items.map((item) => ({ slug: item.slug, quantity: item.quantity }))
        })
      });
      const result = await response.json() as CheckoutResponse;
      if (!response.ok) throw new Error(result.error || result.message || "Checkout could not be completed.");
      if (result.checkoutUrl) { clearCart(); window.location.assign(result.checkoutUrl); return; }
      if (result.orderReference) { clearCart(); setNotice(`Order ${result.orderReference} was created. Check your email for next steps.`); return; }
      throw new Error("The checkout service returned an unexpected response.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkout failed. Please try again.");
    } finally { setSubmitting(false); }
  }

  if (!ready) return <div className="checkout-layout"><p>Loading your bag...</p></div>;
  if (!items.length) return <div className="empty-state checkout-empty"><h2>Your bag is empty</h2><p>Add a product before starting checkout.</p><Link className="button" href="/search">Browse products</Link></div>;

  return <div className="checkout-layout">
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="form-section-heading"><span>01</span><h2>Contact details</h2></div>
      <label><span>Full name</span><input required name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></label>
      <label><span>Email address</span><input required type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} /></label>
      <label><span>Phone number</span><input required type="tel" name="phone" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} /></label>
      <div className="form-section-heading"><span>02</span><h2>Payment</h2></div>
      <div className="payment-placeholder"><span className="payment-icon">↗</span><div><strong>Secure payment handoff</strong><p>Payment is handled by the configured server-side checkout provider. Card details are not collected on this page.</p></div></div>
      {notice && <p className="form-notice" role="status">{notice}</p>}
      <button type="submit" className="button button-block" disabled={submitting || !items.length}>{submitting ? "Connecting to checkout..." : `Continue securely · ${formatPrice(subtotal)}`}</button>
      <p className="checkout-note">Demo mode returns a clear configuration error until a real, authenticated checkout adapter is connected.</p>
    </form>
    <aside className="order-summary checkout-order"><p className="eyebrow">YOUR ORDER</p>
      {items.map((item) => <div className="checkout-item" key={item.id}><div><strong>{item.name}</strong><span>Qty {item.quantity}</span></div><strong>{formatPrice(item.price * item.quantity, item.currency)}</strong></div>)}
      <div className="summary-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
      <p className="checkout-note">Final totals, stock, shipping and discount eligibility must be recalculated by the server before payment.</p>
    </aside>
  </div>;
}