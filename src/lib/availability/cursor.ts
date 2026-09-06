export type SlotCursor = {
  startAt: string;
  id: string;
};

export function encodeSlotCursor(startAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ startAt: startAt.toISOString(), id }),
    "utf8",
  ).toString("base64url");
}

export function decodeSlotCursor(value: string): SlotCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as SlotCursor;
    if (typeof parsed.startAt !== "string" || typeof parsed.id !== "string") return null;
    if (Number.isNaN(Date.parse(parsed.startAt))) return null;
    return parsed;
  } catch {
    return null;
  }
}
