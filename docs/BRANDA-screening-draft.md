# Branda V2 - Senior Frontend Engineer Screening Draft

## Task 1 - Production experience

I want to be transparent about the exact stack of my existing public work. The Marketplace repository contains an eCommerce-style React + Vite frontend with Firebase and a Monnify-backed API. It is not a Next.js application, so I cannot present it as a live Next.js eCommerce site or claim a Next.js version for it.

Relevant work:
- Marketplace code: https://github.com/CTTech-troy/marketplace
- AnchorNews live site: https://www.anchornews.click/ (publishing and technical SEO experience; not eCommerce)

The new storefront-next/ directory is a Next.js App Router prototype built for technical demonstration. It must not be described as prior production experience.

## Task 2 - Technical assessment

### 1. Structure for 50,000 products

I would separate the storefront into route-level server components, reusable UI components, a typed catalogue/data-access layer, and a narrow set of client components for interactions. Product routes would use /products/[slug]; category routes would use /categories/[slug]; search and filters would be expressed as URL parameters. Shared components would include product cards, price display, category navigation, cart controls, loading states and error boundaries.

The catalogue API would return a bounded page of results (for example, 24 products) with total count, next page or cursor metadata. Search, category filters, price ranges and sorting would run at the API/search-index layer, not over the full catalogue in the browser. I would use stable indexed/cursor pagination for large result sets and cache public product/category reads according to their freshness needs. The cart and checkout would be isolated from public catalogue caching.

### 2. Technical SEO and indexation

Each indexable product would have a stable, lowercase canonical URL, unique title/description, Open Graph image and accurate Product JSON-LD including SKU, price, currency and stock status. BreadcrumbList structured data would show the product/category hierarchy. Category pages would have descriptive copy, self-referencing canonicals and CollectionPage/ItemList structured data.

I would generate a sitemap index with separate product sitemap shards, include only canonical, available-to-index URLs and use last-modified dates when reliable. Robots rules would keep cart, checkout and API paths out of crawling. Search/filter combinations, internal admin routes, empty results and duplicate parameter orderings would be noindex or canonicalized according to their actual search value. I would test canonical tags, robots responses, structured data, HTTP status codes, rendered HTML and sitemaps in Search Console.

### 3. Performance and Core Web Vitals

Product/category content should render on the server so the main text, prices and links are available without a large client bundle. I would use Server Components by default and ship JavaScript only for cart controls, filter enhancements and checkout interactions. Images would use the Next Image component with correct dimensions/sizes, modern formats and lazy loading below the fold. The hero image would be prioritized; every image slot would reserve space to prevent layout shift.

The backend/search service would paginate and filter the 50,000-item catalogue. Requests would be debounced for live-search UI, cancelled when superseded, and deduplicated/cached where safe. I would avoid fetching product details repeatedly in each card, avoid client-side waterfalls, and measure route-level bundle size, LCP, INP and CLS using Lighthouse plus real-user monitoring.

### 4. Cart, checkout, auth and failures

The cart UI can optimistically maintain quantities and a local draft for guest browsing, but the client subtotal is only an estimate. Before order creation, the server must reload current prices and stock, calculate discounts/shipping/tax, validate quantities, and create the order idempotently. Payment would be handed off to a provider-hosted checkout or tokenized payment flow. The frontend must never receive provider secret keys or treat browser-supplied prices as trustworthy.

Authentication would use secure, HttpOnly cookies or the chosen auth SDK/session flow, with server-side authorization for account and order routes. Loading, empty, unavailable and error states would be explicit; retry would be offered only for safe/idempotent operations. A failed payment redirect or lost network response would be reconciled against the payment provider webhook/status endpoint instead of blindly creating another order. I would add request IDs, bounded retries, monitoring and structured logs without leaking personal or payment data.

## Task 3 - Code evidence

- Repository: https://github.com/CTTech-troy/marketplace
- New prototype path on the branda-nextjs-screening branch: storefront-next/
- Walkthrough: storefront-next/README.md

The prototype demonstrates the proposed App Router approach, product/category metadata, JSON-LD, segmented sitemap handlers, server-side catalogue adapter, local cart controls, and a disabled-by-default checkout adapter. It is a technical sample and is not yet a deployed, transactional commerce platform.

## Delivery plan

1. Confirm catalogue and checkout API contracts and deployment target.
2. Build the App Router storefront against a small representative dataset.
3. Add product/category rendering, search filters, cart and secure checkout integration.
4. Implement metadata, structured data, robots and partitioned sitemaps.
5. Add type checks, automated tests, API failure tests and accessibility checks.
6. Deploy a staging preview, run mobile/performance/SEO checks, then release after review.

## Required clarification before submission

Branda's first task explicitly requires at least one already-live Next.js eCommerce platform and verifiable personal contributions. The public projects reviewed so far do not establish that specific experience. This draft deliberately does not claim otherwise; the prototype alone does not satisfy that historical production requirement.