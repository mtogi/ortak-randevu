/** Opaque list cursor: last row's `(createdAt, id)` pair (ADR-003 Q-D9). */
export type CreatedCursor = {
  createdAt: string;
  id: string;
};

export function encodeCreatedCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id }),
    "utf8",
  ).toString("base64url");
}

export function decodeCreatedCursor(value: string): CreatedCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as CreatedCursor;
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    if (Number.isNaN(Date.parse(parsed.createdAt))) return null;
    return parsed;
  } catch {
    return null;
  }
}
