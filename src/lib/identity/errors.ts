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
