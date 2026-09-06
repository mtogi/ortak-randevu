import type { LocationType, PrismaClient, Service } from "@prisma/client";
import { ValidationError } from "./errors";
import { assertGridDuration } from "./grid";

const TITLE_MAX = 80;

export type CreateServiceInput = {
  title: string;
  durationMinutes: number;
  locationType?: LocationType;
  description?: string | null;
  priceAmount?: number | null;
  priceCurrency?: string | null;
};

export async function listServices(
  db: PrismaClient,
  providerId: string,
): Promise<Service[]> {
  return db.service.findMany({
    where: { providerId, deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function createService(
  db: PrismaClient,
  providerId: string,
  input: CreateServiceInput,
): Promise<Service> {
  const title = input.title.trim();
  if (!title || title.length > TITLE_MAX) {
    throw new ValidationError(
      "TITLE_INVALID",
      "Service title is required (max 80 characters).",
    );
  }
  assertGridDuration(input.durationMinutes);

  const priceAmount = input.priceAmount ?? null;
  const priceCurrency = input.priceCurrency?.trim() || null;
  if ((priceAmount == null) !== (priceCurrency == null)) {
    throw new ValidationError(
      "PRICE_INCOMPLETE",
      "Price amount and currency must both be set or both omitted.",
    );
  }
  if (priceAmount != null && (!Number.isInteger(priceAmount) || priceAmount < 0)) {
    throw new ValidationError(
      "PRICE_INVALID",
      "Price must be a non-negative integer in minor units.",
    );
  }
  if (priceCurrency && !/^[A-Z]{3}$/.test(priceCurrency)) {
    throw new ValidationError(
      "CURRENCY_INVALID",
      "Currency must be a 3-letter ISO code.",
    );
  }

  const locationType = input.locationType ?? "ONLINE";

  return db.service.create({
    data: {
      providerId,
      title,
      durationMinutes: input.durationMinutes,
      locationType,
      description: input.description?.trim() || null,
      priceAmount,
      priceCurrency,
    },
  });
}
