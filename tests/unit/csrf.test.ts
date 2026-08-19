import { describe, expect, it } from "vitest";
import { assertSafeMutation } from "../../src/lib/csrf";
import { HttpError } from "../../src/lib/errors";

function request(method: string, url: string, origin?: string): Request {
  const headers = new Headers();
  if (origin !== undefined) {
    headers.set("Origin", origin);
  }
  return new Request(url, { method, headers });
}

describe("assertSafeMutation", () => {
  it("allows GET and HEAD without an Origin header", () => {
    expect(() =>
      assertSafeMutation(request("GET", "http://localhost/admin")),
    ).not.toThrow();
    expect(() =>
      assertSafeMutation(request("HEAD", "http://localhost/admin")),
    ).not.toThrow();
  });

  it("rejects POST without an Origin header", () => {
    expect(() => assertSafeMutation(request("POST", "http://localhost/admin"))).toThrow(
      HttpError,
    );
    expect(() => assertSafeMutation(request("POST", "http://localhost/admin"))).toThrow(
      /origin/i,
    );
  });

  it("rejects POST from another origin", () => {
    expect(() =>
      assertSafeMutation(
        request("POST", "http://localhost/admin", "https://evil.example"),
      ),
    ).toThrow(/origin/i);
  });

  it("allows POST from the request origin", () => {
    expect(() =>
      assertSafeMutation(request("POST", "http://localhost/admin", "http://localhost")),
    ).not.toThrow();
  });
});
