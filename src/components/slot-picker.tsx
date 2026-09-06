import { formatDayHeading, formatTimeOfDay } from "@/lib/booking";

export type SlotOption = {
  id: string;
  startAt: Date;
  endAt: Date;
};

type Props = {
  slots: SlotOption[];
  timeZone: string;
  locale: string;
  /** Radio group name; the chosen slot id is submitted under it. */
  name: string;
  emptyLabel: string;
};

/**
 * Radio group of bookable times, grouped by the provider's local day. Plain
 * radios keep this a server component — the guest picks a time and submits
 * one form, so no client-side state is needed.
 */
export function SlotPicker({ slots, timeZone, locale, name, emptyLabel }: Props) {
  if (slots.length === 0) {
    return <p className="text-sm opacity-70">{emptyLabel}</p>;
  }

  const days = new Map<string, SlotOption[]>();
  for (const slot of slots) {
    const key = formatDayHeading(slot.startAt, timeZone, locale);
    const bucket = days.get(key);
    if (bucket) bucket.push(slot);
    else days.set(key, [slot]);
  }

  return (
    <div className="flex flex-col gap-5">
      {[...days.entries()].map(([day, daySlots]) => (
        <fieldset key={day} className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{day}</legend>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((slot) => (
              <label
                key={slot.id}
                className="flex cursor-pointer items-center gap-2 rounded border border-current/20 px-3 py-2 text-sm"
              >
                <input type="radio" name={name} value={slot.id} required />
                {formatTimeOfDay(slot.startAt, timeZone, locale)}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
