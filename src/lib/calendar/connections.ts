import type { CalendarConnection, CalendarKind, PrismaClient } from "@prisma/client";
import { decryptToken, encryptToken } from "./crypto";
import { deleteCalendarConnection } from "./busy";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

export function encryptStoredTokens(tokens: StoredTokens): {
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
} {
  return {
    accessTokenEnc: encryptToken(tokens.accessToken),
    refreshTokenEnc: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
    tokenExpiresAt: tokens.expiresAt,
  };
}

export function decryptStoredTokens(connection: {
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
}): StoredTokens {
  return {
    accessToken: decryptToken(connection.accessTokenEnc),
    refreshToken: connection.refreshTokenEnc
      ? decryptToken(connection.refreshTokenEnc)
      : null,
    expiresAt: connection.tokenExpiresAt,
  };
}

export async function getConnectionByKind(
  db: PrismaClient,
  providerId: string,
  kind: CalendarKind,
): Promise<CalendarConnection | null> {
  return db.calendarConnection.findUnique({
    where: { providerId_kind: { providerId, kind } },
  });
}

export async function upsertGoogleConnection(
  db: PrismaClient,
  input: {
    providerId: string;
    externalAccountId: string | null;
    calendarId?: string;
    tokens: StoredTokens;
    scopes: string;
  },
): Promise<CalendarConnection> {
  const enc = encryptStoredTokens(input.tokens);
  return db.calendarConnection.upsert({
    where: {
      providerId_kind: { providerId: input.providerId, kind: "GOOGLE" },
    },
    create: {
      providerId: input.providerId,
      kind: "GOOGLE",
      externalAccountId: input.externalAccountId,
      calendarId: input.calendarId ?? "primary",
      accessTokenEnc: enc.accessTokenEnc,
      refreshTokenEnc: enc.refreshTokenEnc,
      tokenExpiresAt: enc.tokenExpiresAt,
      scopes: input.scopes,
      status: "ACTIVE",
      lastError: null,
    },
    update: {
      externalAccountId: input.externalAccountId,
      calendarId: input.calendarId ?? "primary",
      accessTokenEnc: enc.accessTokenEnc,
      refreshTokenEnc: enc.refreshTokenEnc ?? undefined,
      tokenExpiresAt: enc.tokenExpiresAt,
      scopes: input.scopes,
      status: "ACTIVE",
      lastError: null,
    },
  });
}

export async function disconnectCalendarKind(
  db: PrismaClient,
  providerId: string,
  kind: CalendarKind,
): Promise<boolean> {
  const existing = await getConnectionByKind(db, providerId, kind);
  if (!existing) return false;
  await deleteCalendarConnection(db, existing.id);
  return true;
}

export async function updateConnectionTokens(
  db: PrismaClient,
  connectionId: string,
  tokens: StoredTokens,
): Promise<void> {
  const enc = encryptStoredTokens(tokens);
  await db.calendarConnection.update({
    where: { id: connectionId },
    data: {
      accessTokenEnc: enc.accessTokenEnc,
      refreshTokenEnc: enc.refreshTokenEnc ?? undefined,
      tokenExpiresAt: enc.tokenExpiresAt,
      status: "ACTIVE",
      lastError: null,
    },
  });
}

export async function markConnectionError(
  db: PrismaClient,
  connectionId: string,
  message: string,
): Promise<void> {
  await db.calendarConnection.update({
    where: { id: connectionId },
    data: {
      status: "ERROR",
      lastError: message.slice(0, 500),
    },
  });
}
