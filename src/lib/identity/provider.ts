import { Prisma } from "@prisma/client";
import type { PrismaClient, Provider } from "@prisma/client";
import { publicBookingPath } from "./booking-url";
import { isValidEmail, normalizeEmail } from "./email";
import { DeletedProviderError, InvalidEmailError } from "./errors";
import { isReservedSlug, slugBaseFromEmail, withSlugSuffix } from "./slug";

export type PublicProvider = {
  id: string;
  email: string;
  name: string | null;
  slug: string;
  timezone: string;
  locale: string;
  publicBookingPath: string;
};

export function toPublicProvider(provider: Provider): PublicProvider {
  return {
    id: provider.id,
    email: provider.email,
    name: provider.name,
    slug: provider.slug,
    timezone: provider.timezone,
    locale: provider.locale,
    publicBookingPath: publicBookingPath(provider.slug),
  };
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function allocateSlug(db: PrismaClient, email: string): Promise<string> {
  const base = slugBaseFromEmail(email);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate =
      attempt === 0 && !isReservedSlug(base)
        ? base
        : withSlugSuffix(base, randomSuffix());
    const taken = await db.provider.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return withSlugSuffix(base, Date.now().toString(36));
}

/**
 * Create or reuse the Provider row for a verified login email.
 * Does not revive soft-deleted providers (Q-D6).
 */
export async function ensureProviderForEmail(
  db: PrismaClient,
  email: string,
): Promise<Provider> {
  if (!isValidEmail(email)) {
    throw new InvalidEmailError();
  }
  const normalized = normalizeEmail(email);

  const existing = await db.provider.findUnique({ where: { email: normalized } });
  if (existing?.deletedAt) {
    throw new DeletedProviderError();
  }
  if (existing) {
    return existing;
  }

  try {
    return await db.provider.create({
      data: {
        email: normalized,
        slug: await allocateSlug(db, normalized),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await db.provider.findUnique({ where: { email: normalized } });
      if (raced && !raced.deletedAt) return raced;
      if (raced?.deletedAt) throw new DeletedProviderError();
    }
    throw error;
  }
}

export async function getActiveProviderById(
  db: PrismaClient,
  id: string,
): Promise<Provider | null> {
  return db.provider.findFirst({
    where: { id, deletedAt: null },
  });
}
