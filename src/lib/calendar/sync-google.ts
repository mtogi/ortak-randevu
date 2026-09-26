import type { CalendarConnection, PrismaClient } from "@prisma/client";
import { replaceBusyBlocks } from "./busy";
import {
  decryptStoredTokens,
  markConnectionError,
  updateConnectionTokens,
} from "./connections";
import {
  fetchGoogleFreeBusy,
  GOOGLE_BUSY_SYNC_DAYS,
  refreshGoogleCalendarAccessToken,
} from "./google";
import type { TimeInterval } from "./overlap";

const REFRESH_SKEW_MS = 60_000;

async function accessTokenForConnection(
  db: PrismaClient,
  connection: CalendarConnection,
): Promise<string> {
  const tokens = decryptStoredTokens(connection);
  const expiresAt = tokens.expiresAt?.getTime() ?? 0;
  if (tokens.accessToken && expiresAt > Date.now() + REFRESH_SKEW_MS) {
    return tokens.accessToken;
  }
  if (!tokens.refreshToken) {
    throw new Error("Google Calendar refresh token missing; reconnect required.");
  }
  const refreshed = await refreshGoogleCalendarAccessToken(tokens.refreshToken);
  const next = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
    expiresAt: refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : null,
  };
  await updateConnectionTokens(db, connection.id, next);
  return next.accessToken;
}

function toIntervals(busy: { start: string; end: string }[]): TimeInterval[] {
  const out: TimeInterval[] = [];
  for (const row of busy) {
    const startAt = new Date(row.start);
    const endAt = new Date(row.end);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) continue;
    if (endAt <= startAt) continue;
    out.push({ startAt, endAt });
  }
  return out;
}

/**
 * Pull FreeBusy for the connection's calendar and replace stored busy blocks.
 * On API failure, marks the connection ERROR and rethrows.
 */
export async function syncGoogleBusy(
  db: PrismaClient,
  connection: CalendarConnection,
  now = new Date(),
): Promise<{ blockCount: number }> {
  try {
    const accessToken = await accessTokenForConnection(db, connection);
    const timeMax = new Date(
      now.getTime() + GOOGLE_BUSY_SYNC_DAYS * 24 * 60 * 60 * 1000,
    );
    const busy = await fetchGoogleFreeBusy({
      accessToken,
      calendarId: connection.calendarId,
      timeMin: now,
      timeMax,
    });
    const blocks = toIntervals(busy);
    const blockCount = await replaceBusyBlocks(db, {
      connectionId: connection.id,
      providerId: connection.providerId,
      blocks,
    });
    await db.calendarConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: now,
        lastError: null,
        status: "ACTIVE",
      },
    });
    return { blockCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    await markConnectionError(db, connection.id, message);
    throw error;
  }
}
