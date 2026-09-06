import { NextResponse } from "next/server";
import { NotFoundError, ValidationError } from "@/lib/availability";

export function availabilityErrorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: 400 },
    );
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: 404 },
    );
  }
  throw error;
}
