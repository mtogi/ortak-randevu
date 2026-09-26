/** Half-open interval overlap: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅ */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

export type TimeInterval = { startAt: Date; endAt: Date };

/** True when the slot overlaps any busy block. */
export function overlapsAnyBusy(
  slot: TimeInterval,
  busy: readonly TimeInterval[],
): boolean {
  return busy.some((block) =>
    intervalsOverlap(slot.startAt, slot.endAt, block.startAt, block.endAt),
  );
}

/** Keep slots that do not overlap any busy interval. */
export function filterSlotsNotBusy<T extends TimeInterval>(
  slots: readonly T[],
  busy: readonly TimeInterval[],
): T[] {
  if (busy.length === 0) return [...slots];
  return slots.filter((slot) => !overlapsAnyBusy(slot, busy));
}
