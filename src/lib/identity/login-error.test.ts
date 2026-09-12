import { describe, expect, it } from "vitest";
import { authPageErrorKey } from "./login-error";

describe("authPageErrorKey", () => {
  it("has no banner when error is absent", () => {
    expect(authPageErrorKey(undefined)).toBeNull();
  });

  it("maps magic-link send failures and invalid email", () => {
    expect(authPageErrorKey("invalid-email")).toBe("invalidEmail");
    expect(authPageErrorKey("send")).toBe("sendFailed");
    expect(authPageErrorKey("EmailSignin")).toBe("sendFailed");
  });

  it("maps Google / OAuth failures separately from mail send", () => {
    expect(authPageErrorKey("OAuthCallback")).toBe("googleFailed");
    expect(authPageErrorKey("OAuthAccountNotLinked")).toBe("googleFailed");
    expect(authPageErrorKey("google")).toBe("googleFailed");
    expect(authPageErrorKey("AccessDenied")).toBe("signInDenied");
  });
});
