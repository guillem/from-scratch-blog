import { describe, expect, it } from "vitest";
import { loginPathForAuthHash } from "../../src/lib/identity-callback";

describe("loginPathForAuthHash", () => {
  it("forwards invite and recovery hashes from the homepage to /login", () => {
    expect(loginPathForAuthHash("/", "", "#invite_token=abc")).toBe(
      "/login#invite_token=abc",
    );
    expect(loginPathForAuthHash("/", "?next=/admin", "#recovery_token=xyz")).toBe(
      "/login?next=/admin#recovery_token=xyz",
    );
  });

  it("leaves /login and unrelated hashes alone", () => {
    expect(loginPathForAuthHash("/login", "", "#invite_token=abc")).toBeNull();
    expect(loginPathForAuthHash("/", "", "#heading")).toBeNull();
    expect(loginPathForAuthHash("/", "", "")).toBeNull();
  });
});
