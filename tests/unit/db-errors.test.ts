import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "../../src/lib/db-errors";

describe("isUniqueViolation", () => {
  it("detects Postgres unique-violation codes", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("walks a cause chain", () => {
    const error = new Error("wrapper", { cause: { code: "23505" } });
    expect(isUniqueViolation(error)).toBe(true);
  });

  it("matches unique-constraint messages", () => {
    expect(isUniqueViolation(new Error("duplicate key value"))).toBe(true);
    expect(isUniqueViolation("unique constraint failed")).toBe(true);
  });

  it("rejects unrelated errors", () => {
    expect(isUniqueViolation(new Error("connection refused"))).toBe(false);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });
});
