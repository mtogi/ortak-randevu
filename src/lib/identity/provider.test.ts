import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  startLocalTestPostgres,
  type LocalTestPostgres,
} from "@/lib/db/test/local-postgres";
import { DeletedProviderError, InvalidEmailError } from "./errors";
import {
  ensureProviderForEmail,
  getActiveProviderById,
  toPublicProvider,
  updateProviderProfile,
} from "./provider";

describe("ensureProviderForEmail", () => {
  let testPg: LocalTestPostgres;
  let db: PrismaClient;

  beforeAll(async () => {
    testPg = await startLocalTestPostgres();
    db = new PrismaClient({ datasources: { db: { url: testPg.databaseUrl } } });
  }, 120_000);

  afterAll(async () => {
    await db.$disconnect();
    await testPg.stop();
  });

  it("rejects invalid email", async () => {
    await expect(ensureProviderForEmail(db, "nope")).rejects.toBeInstanceOf(
      InvalidEmailError,
    );
  });

  it("creates a Provider on first login and reuses it", async () => {
    const first = await ensureProviderForEmail(db, "Dietitian@Example.com");
    const second = await ensureProviderForEmail(db, "dietitian@example.com");
    expect(second.id).toBe(first.id);
    expect(first.email).toBe("dietitian@example.com");
    expect(first.slug.length).toBeGreaterThan(0);
    expect(toPublicProvider(first).publicBookingPath).toBe(`/book/${first.slug}`);
  });

  it("does not revive a soft-deleted provider", async () => {
    const created = await ensureProviderForEmail(db, "gone@example.com");
    await db.provider.update({
      where: { id: created.id },
      data: { deletedAt: new Date() },
    });
    await expect(ensureProviderForEmail(db, "gone@example.com")).rejects.toBeInstanceOf(
      DeletedProviderError,
    );
    await expect(getActiveProviderById(db, created.id)).resolves.toBeNull();
  });

  it("updates display name and locale, and clears an empty name", async () => {
    const provider = await ensureProviderForEmail(db, "settings@example.com");
    const named = await updateProviderProfile(db, provider.id, {
      name: "  Ayşe  Yılmaz ",
      locale: "tr",
    });
    expect(named.name).toBe("Ayşe Yılmaz");
    expect(named.locale).toBe("tr");

    const cleared = await updateProviderProfile(db, named.id, { name: "   " });
    expect(cleared.name).toBeNull();
    expect(cleared.locale).toBe("tr");
  });

  it("rejects a too-long name or an unknown locale", async () => {
    const provider = await ensureProviderForEmail(db, "bad-settings@example.com");
    await expect(
      updateProviderProfile(db, provider.id, { name: "a".repeat(81) }),
    ).rejects.toMatchObject({ code: "NAME_INVALID" });
    await expect(
      updateProviderProfile(db, provider.id, { locale: "de" }),
    ).rejects.toMatchObject({ code: "LOCALE_INVALID" });
  });
});
