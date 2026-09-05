const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "book",
  "health",
  "login",
  "me",
  "settings",
]);

export function slugBaseFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "provider";
  const slug = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug.length > 0 ? slug : "provider";
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function withSlugSuffix(base: string, suffix: string): string {
  const trimmed = `${base}-${suffix}`.slice(0, 48);
  return trimmed.replace(/-+$/g, "");
}
