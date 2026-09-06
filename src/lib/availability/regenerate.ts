import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "./errors";
import { overlaps, proposeSlots } from "./generate";
import { listExceptions, listWeeklyHours } from "./hours";

export type RegenerateResult = {
  created: number;
  skippedOverlap: number;
};

/**
 * Replace future OPEN slots for one service. Leaves BOOKED/BLOCKED.
 * Skips proposed intervals that overlap any remaining slot (Q-D2 / unique startAt).
 */
export async function regenerateSlotsForService(
  db: PrismaClient,
  input: { providerId: string; serviceId: string; now?: Date; horizonDays?: number },
): Promise<RegenerateResult> {
  const now = input.now ?? new Date();
  const provider = await db.provider.findFirst({
    where: { id: input.providerId, deletedAt: null },
  });
  if (!provider) {
    throw new NotFoundError("PROVIDER_NOT_FOUND", "Provider not found.");
  }

  const service = await db.service.findFirst({
    where: {
      id: input.serviceId,
      providerId: input.providerId,
      deletedAt: null,
      isActive: true,
    },
  });
  if (!service) {
    throw new NotFoundError("SERVICE_NOT_FOUND", "Active service not found.");
  }

  const [weeklyRows, exceptionRows] = await Promise.all([
    listWeeklyHours(db, input.providerId),
    listExceptions(db, input.providerId),
  ]);

  const proposed = proposeSlots({
    timeZone: provider.timezone,
    durationMinutes: service.durationMinutes,
    weekly: weeklyRows,
    exceptions: exceptionRows,
    now,
    horizonDays: input.horizonDays,
  });

  return db.$transaction(async (tx) => {
    await tx.slot.deleteMany({
      where: {
        providerId: input.providerId,
        serviceId: input.serviceId,
        status: "OPEN",
        startAt: { gte: now },
      },
    });

    const blocking = await tx.slot.findMany({
      where: {
        providerId: input.providerId,
        startAt: { gte: now },
      },
      select: { startAt: true, endAt: true },
    });

    const toCreate = proposed.filter(
      (slot) => !blocking.some((existing) => overlaps(slot, existing)),
    );

    if (toCreate.length > 0) {
      await tx.slot.createMany({
        data: toCreate.map((slot) => ({
          providerId: input.providerId,
          serviceId: input.serviceId,
          startAt: slot.startAt,
          endAt: slot.endAt,
          status: "OPEN" as const,
        })),
      });
    }

    return {
      created: toCreate.length,
      skippedOverlap: proposed.length - toCreate.length,
    };
  });
}

export async function regenerateAllActiveServices(
  db: PrismaClient,
  providerId: string,
  options?: { now?: Date; horizonDays?: number },
): Promise<RegenerateResult> {
  const services = await db.service.findMany({
    where: { providerId, deletedAt: null, isActive: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  let created = 0;
  let skippedOverlap = 0;
  for (const service of services) {
    const result = await regenerateSlotsForService(db, {
      providerId,
      serviceId: service.id,
      now: options?.now,
      horizonDays: options?.horizonDays,
    });
    created += result.created;
    skippedOverlap += result.skippedOverlap;
  }
  return { created, skippedOverlap };
}
