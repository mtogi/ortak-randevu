import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { NotFoundError, ValidationError } from "@/lib/availability";

export function isPrismaUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function availabilityErrorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: 400 },
    );
  }
  if (isPrismaUniqueConflict(error)) {
    return NextResponse.json(
      {
        error: "HOURS_CONFLICT",
        message: "Could not save hours because of an existing row. Try again.",
      },
      { status: 409 },
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
