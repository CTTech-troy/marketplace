export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return new URL("http://localhost:3000");
  try {
    return new URL(configured);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

export function escapeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function canIndexSite(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim());
}