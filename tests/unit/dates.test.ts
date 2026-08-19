import { describe, expect, it } from "vitest";
import { formatDate, formatDateIso } from "../../src/lib/dates";

describe("formatDate", () => {
  it("returns an empty string for missing values", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });

  it("formats Date and ISO strings", () => {
    const value = "2026-08-19T12:00:00.000Z";
    expect(formatDate(value)).toMatch(/August 19, 2026/);
    expect(formatDate(new Date(value))).toMatch(/August 19, 2026/);
  });
});

describe("formatDateIso", () => {
  it("returns an empty string for missing values", () => {
    expect(formatDateIso(null)).toBe("");
    expect(formatDateIso(undefined)).toBe("");
  });

  it("returns an ISO timestamp", () => {
    const value = "2026-08-19T12:00:00.000Z";
    expect(formatDateIso(value)).toBe(value);
    expect(formatDateIso(new Date(value))).toBe(value);
  });
});
