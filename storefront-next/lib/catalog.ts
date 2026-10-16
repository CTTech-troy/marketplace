import "server-only";

export type Category = {
  slug: string;
  name: string;
  description: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: "NGN";
  image: string;
  sku: string;
  inStock: boolean;
  updatedAt: string;
};

export type ProductQuery = {
  search?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
};

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const demoCategories: Category[] = [
  { slug: "apparel", name: "Apparel", description: "Everyday essentials with considered materials and clean design." },
  { slug: "accessories", name: "Accessories", description: "Small details and useful pieces for everyday life." },
  { slug: "home", name: "Home and Living", description: "Thoughtful objects for calmer, more useful spaces." },
  { slug: "technology", name: "Technology", description: "Practical tech accessories for work and travel." }
];

const demoProducts: Product[] = [
  { id: "p-001", slug: "everyday-canvas-tote", name: "Everyday Canvas Tote", description: "A durable cotton canvas tote with reinforced handles and an easy-to-clean inner pocket.", category: "accessories", price: 18500, currency: "NGN", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=85", sku: "MKT-ACC-001", inStock: true, updatedAt: "2026-10-01" },
  { id: "p-002", slug: "classic-cotton-tee", name: "Classic Cotton Tee", description: "A soft, everyday cotton T-shirt with a relaxed fit and reinforced neckline.", category: "apparel", price: 22000, currency: "NGN", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&auto=format&fit=crop&q=85", sku: "MKT-APP-002", inStock: true, updatedAt: "2026-10-01" },
  { id: "p-003", slug: "minimal-desk-lamp", name: "Minimal Desk Lamp", description: "A compact adjustable lamp designed for focused reading and productive workspaces.", category: "home", price: 47500, currency: "NGN", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000&auto=format&fit=crop&q=85", sku: "MKT-HOM-003", inStock: true, updatedAt: "2026-09-26" },
  { id: "p-004", slug: "travel-tech-organizer", name: "Travel Tech Organizer", description: "A slim organizer for cables, chargers, cards, and small travel essentials.", category: "technology", price: 16500, currency: "NGN", image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1000&auto=format&fit=crop&q=85", sku: "MKT-TEC-004", inStock: true, updatedAt: "2026-09-24" },
  { id: "p-005", slug: "ceramic-coffee-mug", name: "Ceramic Coffee Mug", description: "A sturdy glazed ceramic mug with a comfortable handle for everyday coffee or tea.", category: "home", price: 12500, currency: "NGN", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1000&auto=format&fit=crop&q=85", sku: "MKT-HOM-005", inStock: true, updatedAt: "2026-09-22" },
  { id: "p-006", slug: "everyday-backpack", name: "Everyday Backpack", description: "A versatile backpack with a padded laptop sleeve and weather-resistant outer fabric.", category: "accessories", price: 62000, currency: "NGN", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&auto=format&fit=crop&q=85", sku: "MKT-ACC-006", inStock: true, updatedAt: "2026-09-20" },
  { id: "p-007", slug: "wireless-headphones", name: "Wireless Headphones", description: "Comfort-focused over-ear headphones for work, travel, and everyday listening.", category: "technology", price: 89000, currency: "NGN", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=85", sku: "MKT-TEC-007", inStock: true, updatedAt: "2026-09-19" },
  { id: "p-008", slug: "linen-blend-shirt", name: "Linen Blend Shirt", description: "A breathable long-sleeve shirt with a relaxed silhouette for warm-weather days.", category: "apparel", price: 39500, currency: "NGN", image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=1000&auto=format&fit=crop&q=85", sku: "MKT-APP-008", inStock: true, updatedAt: "2026-09-18" },
  { id: "p-009", slug: "reusable-water-bottle", name: "Reusable Water Bottle", description: "A reusable bottle made for commutes, workouts, and days away from home.", category: "accessories", price: 14500, currency: "NGN", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1000&auto=format&fit=crop&q=85", sku: "MKT-ACC-009", inStock: true, updatedAt: "2026-09-16" },
  { id: "p-010", slug: "wireless-charging-stand", name: "Wireless Charging Stand", description: "A tidy charging stand that keeps a compatible phone visible on a desk or bedside table.", category: "technology", price: 27500, currency: "NGN", image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1000&auto=format&fit=crop&q=85", sku: "MKT-TEC-010", inStock: true, updatedAt: "2026-09-15" },
  { id: "p-011", slug: "soft-knit-throw", name: "Soft Knit Throw", description: "A textured throw blanket for a sofa, reading corner, or quiet weekend morning.", category: "home", price: 51000, currency: "NGN", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&auto=format&fit=crop&q=85", sku: "MKT-HOM-011", inStock: false, updatedAt: "2026-09-14" },
  { id: "p-012", slug: "everyday-sling-bag", name: "Everyday Sling Bag", description: "A compact crossbody bag that keeps daily essentials close and organised.", category: "accessories", price: 32500, currency: "NGN", image: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=1000&auto=format&fit=crop&q=85", sku: "MKT-ACC-012", inStock: true, updatedAt: "2026-09-12" }
];

const fallbackPageSize = 24;

function getCatalogApi(): string | null {
  const value = process.env.COMMERCE_API_BASE_URL?.trim();
  return value ? value.replace(/\/+$/, "") : null;
}

function filterDemoProducts(query: ProductQuery): Product[] {
  const needle = query.search?.trim().toLowerCase();
  return demoProducts
    .filter((p) => !query.category || p.category === query.category)
    .filter((p) => !needle || `${p.name} ${p.description} ${p.sku}`.toLowerCase().includes(needle))
    .filter((p) => query.minPrice === undefined || p.price >= query.minPrice)
    .filter((p) => query.maxPrice === undefined || p.price <= query.maxPrice)
    .sort((a, b) => {
      if (query.sort === "price-asc") return a.price - b.price;
      if (query.sort === "price-desc") return b.price - a.price;
      if (query.sort === "name") return a.name.localeCompare(b.name);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

function normalizeProductPage(data: unknown, query: ProductQuery): ProductPage {
  const raw = data as { items?: Product[]; products?: Product[]; total?: number; page?: number; pageSize?: number; totalPages?: number };
  const items = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.products) ? raw.products : [];
  const page = Number(raw.page ?? query.page ?? 1);
  const pageSize = Number(raw.pageSize ?? query.pageSize ?? fallbackPageSize);
  const total = Number(raw.total ?? items.length);
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Number(raw.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize))))
  };
}

export async function listProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(48, Math.max(1, Math.floor(query.pageSize ?? fallbackPageSize)));
  const params = { ...query, page, pageSize };
  const api = getCatalogApi();

  if (api) {
    const url = new URL(`${api}/store/products`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (query.search) url.searchParams.set("q", query.search);
    if (query.category) url.searchParams.set("category", query.category);
    if (query.sort) url.searchParams.set("sort", query.sort);
    if (query.minPrice !== undefined) url.searchParams.set("minPrice", String(query.minPrice));
    if (query.maxPrice !== undefined) url.searchParams.set("maxPrice", String(query.maxPrice));

    const response = await fetch(url, { next: { revalidate: 60, tags: ["catalog"] } });
    if (!response.ok) throw new Error(`Catalog API returned HTTP ${response.status}`);
    return normalizeProductPage(await response.json(), params);
  }

  const all = filterDemoProducts(params);
  const start = (page - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    total: all.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(all.length / pageSize))
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const api = getCatalogApi();
  if (api) {
    const response = await fetch(`${api}/store/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300, tags: [`product:${slug}`, "catalog"] }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Product API returned HTTP ${response.status}`);
    const payload = await response.json() as { product?: Product } | Product;
    return ("product" in payload ? payload.product : payload) ?? null;
  }
  return demoProducts.find((product) => product.slug === slug) ?? null;
}

export function getDemoCatalogCount(): number {
  return demoProducts.length;
}

export async function getCategories(): Promise<Category[]> {
  const api = getCatalogApi();
  if (!api) return demoCategories;

  const response = await fetch(`${api}/store/categories`, {
    next: { revalidate: 300, tags: ["categories"] }
  });
  if (!response.ok) throw new Error(`Category API returned HTTP ${response.status}`);

  const payload = await response.json() as { items?: unknown; categories?: unknown };
  const raw = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.categories)
      ? payload.categories
      : [];

  return raw.flatMap((item): Category[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.slug) ||
      typeof candidate.name !== "string" ||
      typeof candidate.description !== "string"
    ) return [];
    return [{
      slug: candidate.slug,
      name: candidate.name,
      description: candidate.description
    }];
  });
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const list = await getCategories();
  return list.find((item) => item.slug === slug);
}