// Prisma client singleton. Per ADR-001, domain modules (and, later, route
// handlers via those modules) import from here rather than constructing
// their own `PrismaClient`. Standard Next.js dev-mode singleton so hot
// reload does not exhaust Postgres connections.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
