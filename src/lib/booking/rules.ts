import { GUEST_MODIFY_CUTOFF_MS } from "./constants";
import { ModifyWindowClosedError } from "./errors";

/** Last instant at which a guest may still cancel or reschedule (Q-P6). */
export function guestModifyDeadline(startAt: Date): Date {
  return new Date(startAt.getTime() - GUEST_MODIFY_CUTOFF_MS);
}

export function guestCanModify(startAt: Date, now: Date): boolean {
  return now.getTime() <= guestModifyDeadline(startAt).getTime();
}

export function assertGuestCanModify(startAt: Date, now: Date): void {
  if (!guestCanModify(startAt, now)) {
    throw new ModifyWindowClosedError(
      "MODIFY_WINDOW_CLOSED",
      "This booking can no longer be changed online. Contact your dietitian.",
    );
  }
}
