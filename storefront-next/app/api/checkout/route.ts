import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutInput = {
  customer?: { name?: unknown; email?: unknown; phone?: unknown };
  items?: { slug?: unknown; quantity?: unknown }[];
};

function boundedText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export async function POST(request: NextRequest) {
  let input: CheckoutInput;
  try {
    input = await request.json() as CheckoutInput;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const customer = input.customer;
  if (!customer || !boundedText(customer.name, 100) ||
      !boundedText(customer.email, 254) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) ||
      !boundedText(customer.phone, 30)) {
    return NextResponse.json({ error: "Enter a valid name, email address and phone number." }, { status: 400 });
  }

  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 30) {
    return NextResponse.json({ error: "Your order must contain between 1 and 30 distinct items." }, { status: 400 });
  }

  const items: { slug: string; quantity: number }[] = [];
  const seen = new Set<string>();
  for (const item of input.items) {
    if (!item || !boundedText(item.slug, 120) ||
        !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 10) {
      return NextResponse.json({ error: "One or more cart items are invalid." }, { status: 400 });
    }
    const slug = item.slug.trim();
    if (seen.has(slug)) return NextResponse.json({ error: "Duplicate product entries are not accepted." }, { status: 400 });
    seen.add(slug);
    items.push({ slug, quantity: Number(item.quantity) });
  }

  const endpoint = process.env.COMMERCE_CHECKOUT_API_URL?.trim();
  const sharedSecret = process.env.COMMERCE_CHECKOUT_SHARED_SECRET;
  if (!endpoint || !sharedSecret) {
    return NextResponse.json({
      error: "Checkout is not connected yet. Configure a trusted server-side commerce checkout API before accepting orders."
    }, { status: 503 });
  }

  let target: URL;
  try {
    target = new URL(endpoint);
    if (!["https:", "http:"].includes(target.protocol)) throw new Error("Invalid protocol");
    if (process.env.NODE_ENV === "production" && target.protocol !== "https:") throw new Error("HTTPS required in production");
  } catch {
    return NextResponse.json({ error: "Checkout service configuration is invalid." }, { status: 500 });
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.slice(0, 128) || crypto.randomUUID();
  try {
    const upstream = await fetch(target, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
      headers: {
        "content-type": "application/json",
        "x-storefront-secret": sharedSecret,
        "idempotency-key": idempotencyKey
      },
      body: JSON.stringify({
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim().toLowerCase(),
          phone: customer.phone.trim()
        },
        items
      })
    });

    const payload = await upstream.json().catch(() => ({})) as {
      checkoutUrl?: unknown; orderReference?: unknown; message?: unknown;
    };
    if (!upstream.ok) {
      return NextResponse.json({ error: "The checkout provider could not create your order. Please try again." }, { status: 502 });
    }

    const response: { checkoutUrl?: string; orderReference?: string; message?: string } = {};
    if (typeof payload.checkoutUrl === "string") {
      try {
        const checkoutUrl = new URL(payload.checkoutUrl);
        if (["https:", "http:"].includes(checkoutUrl.protocol)) response.checkoutUrl = checkoutUrl.toString();
      } catch { /* Do not redirect to a malformed provider URL. */ }
    }
    if (typeof payload.orderReference === "string") response.orderReference = payload.orderReference.slice(0, 100);
    if (typeof payload.message === "string") response.message = payload.message.slice(0, 200);
    if (!response.checkoutUrl && !response.orderReference) {
      return NextResponse.json({ error: "Checkout returned an invalid response." }, { status: 502 });
    }
    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The checkout service is unavailable. Please try again shortly." }, { status: 502 });
  }
}