export class AvailabilityError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AvailabilityError";
    this.code = code;
  }
}

export class ValidationError extends AvailabilityError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AvailabilityError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = "NotFoundError";
  }
}
