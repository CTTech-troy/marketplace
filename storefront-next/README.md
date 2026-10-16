# Marketplace Next.js Storefront (Assessment Prototype)

A separate Next.js App Router storefront added beside the existing Vite application. It demonstrates catalogue browsing, filters, product details, metadata and JSON-LD, cart state, segmented product sitemaps, and a server-side checkout adapter boundary.

> This is an assessment prototype, not evidence of prior live Next.js eCommerce experience. The existing Marketplace frontend uses React + Vite. Do not describe this branch as a previously deployed Next.js shop.

## Stack
- Next.js 16.4 App Router, React 19, TypeScript
- Server Components for catalogue and product reads
- Client Components limited to interactive cart controls and checkout form
- Metadata API, canonical URLs, Product/Breadcrumb/Collection/WebSite JSON-LD
- robots.ts and a sitemap index split into product sitemap shards
- Server-side checkout proxy with request validation, idempotency header, timeout and safe errors

## Run locally
Requires Node.js 22 or later.

~~~sh
cd storefront-next
cp .env.example .env.local
npm install
npm run dev
~~~

Open http://localhost:3000. Without API configuration, the app uses a small sample catalogue. It is intentionally noindex until NEXT_PUBLIC_SITE_URL is configured.

Checks before preview or deployment:

~~~sh
npm run typecheck
npm run lint
npm run build
~~~

## Environment
- NEXT_PUBLIC_SITE_URL: deployed canonical origin. Public value only.
- COMMERCE_API_BASE_URL: server-side commerce API origin.
- COMMERCE_CHECKOUT_API_URL: trusted server-side order/checkout endpoint.
- COMMERCE_CHECKOUT_SHARED_SECRET: server-only secret sent to the trusted checkout adapter.

Never prefix secrets with NEXT_PUBLIC_. Never put card numbers or payment-provider secret keys in browser state.

## Expected read API contract
The catalogue adapter calls:

- GET /store/products?page=1&pageSize=24&q=&category=&sort=&minPrice=&maxPrice=
- GET /store/products/:slug
- GET /store/categories

Category response (use either wrapper name):

~~~json
{
  "items": [
    { "slug": "accessories", "name": "Accessories", "description": "Useful everyday objects." }
  ]
}
~~~

A category slug must be lowercase kebab-case and stable. Use the same canonical slug in category links, product references, structured data and sitemap URLs.

List response:

~~~json
{
  "items": [
    {
      "id": "item-id",
      "slug": "canonical-product-slug",
      "name": "Product name",
      "description": "Product description",
      "category": "accessories",
      "price": 18500,
      "currency": "NGN",
      "image": "https://images.example.com/item.webp",
      "sku": "SKU-001",
      "inStock": true,
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  ],
  "total": 50000,
  "page": 1,
  "pageSize": 24,
  "totalPages": 2084
}
~~~

The API must filter/search and paginate on the server. The frontend must not download 50,000 products to filter them in the browser. For a large catalogue, use an indexed search service or database queries with stable cursor pagination. The sitemap adapter requests 1,000 products per partition and expects total count metadata.

## Expected checkout adapter contract
The storefront sends only product slugs and quantities, never trusted prices:

~~~json
{
  "customer": { "name": "Customer", "email": "customer@example.com", "phone": "+234..." },
  "items": [{ "slug": "everyday-canvas-tote", "quantity": 2 }]
}
~~~

The server-side checkout API must authenticate/validate the customer as appropriate, resolve product prices and stock from the trusted catalogue, recalculate discounts/shipping/tax, enforce idempotency, create a pending order, and return either checkoutUrl or orderReference. It must implement rate limiting, audit logging and a trusted-secret check. The demo returns HTTP 503 until both server-side checkout variables are configured.

## SEO and rendering
- Product pages: unique title/description, canonical URL, Open Graph image, Product and BreadcrumbList JSON-LD.
- Category pages: unique metadata, canonical URL and CollectionPage/ItemList schema.
- Search/filter pages: noindex to avoid indexing an unbounded set of URL combinations.
- Cart/checkout/API: noindex or disallowed from crawling.
- Sitemap index: static category sitemap plus paginated product sitemap shards.
- SSR/ISR: product and category content is server-rendered and revalidated; catalogue fetches use short revalidation.
- Images reserve aspect ratio and use Next Image sizing to reduce layout shift.
- Search and filter work through query parameters and server-side API calls.

## Before production
1. Connect a real, authenticated commerce read API and checkout adapter.
2. Add automated component/integration tests and API contract tests.
3. Verify sitemap URLs, JSON-LD, canonicals, robots responses and 404s against the deployed domain.
4. Test Core Web Vitals with real content and device/network throttling.
5. Verify payment callbacks/webhooks server-side and implement order reconciliation.
6. Configure CDN/cache policy, monitoring, backups and error tracking.
7. Review the host repository for previously committed environment values. Rotate any leaked credentials and clean Git history separately before treating the repository as safe.

## Deployment note
For a separate preview, import this repository into the hosting platform and set the project root to storefront-next. Do not change the production deployment for the existing frontend/ directory. A deployment of this prototype would be a new demo, not proof that a previous live Next.js eCommerce platform was delivered.