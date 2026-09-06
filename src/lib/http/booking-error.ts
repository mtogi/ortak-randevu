import { NextResponse } from "next/server";
import {
  BookingNotFoundError,
  BookingValidationError,
  ModifyWindowClosedError,
  SlotUnavailableError,
} from "@/lib/booking";

/** Domain errors → HTTP. Anything unrecognised keeps bubbling to a 500. */
export function bookingErrorResponse(error: unknown): NextResponse {
  const status =
    error instanceof BookingValidationError
      ? 400
      : error instanceof BookingNotFoundError
        ? 404
        : error instanceof SlotUnavailableError ||
            error instanceof ModifyWindowClosedError
          ? 409
          : null;

  if (status === null) throw error;
  const domainError = error as BookingValidationError;
  return NextResponse.json(
    { error: domainError.code, message: domainError.message },
    { status },
  );
}
