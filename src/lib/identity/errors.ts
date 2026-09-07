export class IdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityError";
  }
}

export class DeletedProviderError extends IdentityError {
  constructor() {
    super("This provider account is no longer active.");
    this.name = "DeletedProviderError";
  }
}

export class InvalidEmailError extends IdentityError {
  constructor() {
    super("A valid email is required.");
    this.name = "InvalidEmailError";
  }
}

/** Bad display name or locale on the provider settings form. HTTP 400. */
export class ProfileValidationError extends IdentityError {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ProfileValidationError";
    this.code = code;
  }
}
