import { afterEach, describe, expect, it } from "vitest";
import {
  googleEmailIsVerified,
  googleOAuthCredentials,
  isGoogleSignInEnabled,
} from "./google";

const originalId = process.env.AUTH_GOOGLE_ID;
const originalSecret = process.env.AUTH_GOOGLE_SECRET;

afterEach(() => {
  if (originalId === undefined) delete process.env.AUTH_GOOGLE_ID;
  else process.env.AUTH_GOOGLE_ID = originalId;
  if (originalSecret === undefined) delete process.env.AUTH_GOOGLE_SECRET;
  else process.env.AUTH_GOOGLE_SECRET = originalSecret;
});

describe("isGoogleSignInEnabled", () => {
  it("is off when either env var is missing or blank", () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    expect(isGoogleSignInEnabled()).toBe(false);

    process.env.AUTH_GOOGLE_ID = "id";
    delete process.env.AUTH_GOOGLE_SECRET;
    expect(isGoogleSignInEnabled()).toBe(false);

    delete process.env.AUTH_GOOGLE_ID;
    process.env.AUTH_GOOGLE_SECRET = "secret";
    expect(isGoogleSignInEnabled()).toBe(false);

    process.env.AUTH_GOOGLE_ID = "  ";
    process.env.AUTH_GOOGLE_SECRET = "secret";
    expect(isGoogleSignInEnabled()).toBe(false);
  });

  it("is on only when both Client ID and secret are set", () => {
    process.env.AUTH_GOOGLE_ID = "id.apps.googleusercontent.com";
    process.env.AUTH_GOOGLE_SECRET = "secret";
    expect(isGoogleSignInEnabled()).toBe(true);
  });
});

describe("googleOAuthCredentials", () => {
  it("strips wrapping quotes and whitespace that cause invalid_client", () => {
    process.env.AUTH_GOOGLE_ID = '  "id.apps.googleusercontent.com"  \n';
    process.env.AUTH_GOOGLE_SECRET = "'secret-value'";
    expect(googleOAuthCredentials()).toEqual({
      clientId: "id.apps.googleusercontent.com",
      clientSecret: "secret-value",
    });
  });
});

describe("googleEmailIsVerified", () => {
  it("requires email_verified true", () => {
    expect(googleEmailIsVerified({ email_verified: true })).toBe(true);
    expect(googleEmailIsVerified({ email_verified: false })).toBe(false);
    expect(googleEmailIsVerified({ email_verified: null })).toBe(false);
    expect(googleEmailIsVerified({})).toBe(false);
    expect(googleEmailIsVerified(undefined)).toBe(false);
  });
});
