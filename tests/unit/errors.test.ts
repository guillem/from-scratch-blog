import { describe, expect, it } from "vitest";
import {
  badRequest,
  conflict,
  forbidden,
  HttpError,
  notFound,
  publicErrorMessage,
  unauthorized,
} from "../../src/lib/errors";

describe("HttpError helpers", () => {
  it("sets status codes used by auth and writes", () => {
    expect(unauthorized().status).toBe(401);
    expect(forbidden().status).toBe(403);
    expect(notFound().status).toBe(404);
    expect(conflict("taken").status).toBe(409);
    expect(badRequest("bad").status).toBe(400);
  });

  it("exposes 4xx messages and hides unknown errors", () => {
    expect(publicErrorMessage(unauthorized())).toBe("Authentication required.");
    expect(publicErrorMessage(new Error("secret"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(publicErrorMessage(new HttpError(500, "boom", { expose: false }))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
