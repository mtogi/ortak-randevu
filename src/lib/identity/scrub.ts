// Q-D6 / Q-L3: KVKK "deletion" is a PII scrub, not a hard delete.
// Booking and BookingEvent rows keep their FKs; only contact fields go to null.
import type { Client, Prisma, PrismaClient, Provider } from "@prisma/client";

export type ScrubDb = PrismaClient | Prisma.TransactionClient;

/**
 * Null Provider email/name/bio, set deletedAt, and drop Auth.js credential
 * rows for that email so the deleted account cannot be used to sign in.
 * Idempotent: a second call on an already-scrubbed row is a no-op.
 */
export async function scrubProviderAccount(
  db: PrismaClient,
  providerId: string,
): Promise<Provider> {
  return db.$transaction(async (tx) => {
    const existing = await tx.provider.findUnique({ where: { id: providerId } });
    if (!existing) {
      throw new Error("Provider not found.");
    }
    if (existing.deletedAt && existing.email === null) {
      return existing;
    }

    const email = existing.email;
    const updated = await tx.provider.update({
      where: { id: providerId },
      data: {
        email: null,
        name: null,
        bio: null,
        deletedAt: existing.deletedAt ?? new Date(),
      },
    });

    if (email) {
      await tx.user.deleteMany({ where: { email } });
      await tx.verificationToken.deleteMany({ where: { identifier: email } });
    }

    return updated;
  });
}

/**
 * Null Client email/name/phone and set deletedAt. Guest self-serve erasure
 * and tests keep Booking FKs resolving. A later booking with the same
 * address creates a new Client row — the email is gone, so it cannot be reused.
 */
export async function scrubClientRecord(db: ScrubDb, clientId: string): Promise<Client> {
  const existing = await db.client.findUnique({ where: { id: clientId } });
  if (!existing) {
    throw new Error("Client not found.");
  }
  if (existing.deletedAt && existing.email === null) {
    return existing;
  }
  return db.client.update({
    where: { id: clientId },
    data: {
      email: null,
      name: null,
      phone: null,
      deletedAt: existing.deletedAt ?? new Date(),
    },
  });
}
