export class BookingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

/** Bad guest input or a malformed request. HTTP 400. */
export class BookingValidationError extends BookingError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = "BookingValidationError";
  }
}

/** Missing (or deliberately indistinguishable) booking / provider. HTTP 404. */
export class BookingNotFoundError extends BookingError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = "BookingNotFoundError";
  }
}

/**
 * The slot was taken, blocked, removed, or is in the past. HTTP 409 — this is
 * the application-level face of the `booking_slot_active_unique` index.
 */
export class SlotUnavailableError extends BookingError {
  constructor(message = "That time is no longer available.") {
    super("SLOT_UNAVAILABLE", message);
    this.name = "SlotUnavailableError";
  }
}

/** Past the Q-P6 guest cutoff, or the booking is no longer CONFIRMED. HTTP 409. */
export class ModifyWindowClosedError extends BookingError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = "ModifyWindowClosedError";
  }
}

/**
 * Codes that have translated copy under `book.errors` / `manageBooking.errors`
 * in `messages/*.json`. A code missing from this list falls back to a generic
 * message rather than rendering a raw identifier to a guest.
 */
export const GUEST_ERROR_CODES = [
  "NAME_INVALID",
  "EMAIL_INVALID",
  "PHONE_INVALID",
  "SLOT_REQUIRED",
  "SLOT_UNCHANGED",
  "SLOT_UNAVAILABLE",
  "PROVIDER_NOT_FOUND",
  "BOOKING_NOT_FOUND",
  "BOOKING_NOT_CONFIRMED",
  "MODIFY_WINDOW_CLOSED",
] as const;

export type GuestErrorCode = (typeof GUEST_ERROR_CODES)[number];

export function isGuestErrorCode(value: string | undefined): value is GuestErrorCode {
  return (
    Boolean(value) && (GUEST_ERROR_CODES as readonly string[]).includes(value as string)
  );
}
