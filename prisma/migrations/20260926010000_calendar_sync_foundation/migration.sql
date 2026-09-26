-- Calendar sync foundation (ADR-009): connections + busy blocks.
-- Does not touch booking_slot_active_unique.

CREATE TYPE "CalendarKind" AS ENUM ('GOOGLE');

CREATE TYPE "CalendarConnectionStatus" AS ENUM ('ACTIVE', 'ERROR');

CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "kind" "CalendarKind" NOT NULL,
    "externalAccountId" TEXT,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT NOT NULL,
    "status" "CalendarConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "syncCursor" TEXT,
    "channelId" TEXT,
    "channelExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarBusyBlock" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ NOT NULL,
    "endAt" TIMESTAMPTZ NOT NULL,
    "externalEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarBusyBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalendarConnection_providerId_kind_key" ON "CalendarConnection"("providerId", "kind");

CREATE INDEX "CalendarConnection_providerId_idx" ON "CalendarConnection"("providerId");

CREATE INDEX "CalendarBusyBlock_providerId_startAt_endAt_idx" ON "CalendarBusyBlock"("providerId", "startAt", "endAt");

CREATE INDEX "CalendarBusyBlock_connectionId_idx" ON "CalendarBusyBlock"("connectionId");

ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CalendarBusyBlock" ADD CONSTRAINT "CalendarBusyBlock_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarBusyBlock" ADD CONSTRAINT "CalendarBusyBlock_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
