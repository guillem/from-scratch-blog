import { describe, expect, it } from "vitest";
import { safeNextPath } from "../../src/lib/redirects";

describe("safeNextPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/posts/new")).toBe("/admin/posts/new");
    expect(safeNextPath("/admin?saved=1")).toBe("/admin?saved=1");
  });

  it("rejects absolute, protocol-relative, and javascript URLs", () => {
    expect(safeNextPath("https://evil.example")).toBe("/admin");
    expect(safeNextPath("//evil.example")).toBe("/admin");
    expect(safeNextPath("javascript:alert(1)")).toBe("/admin");
    expect(safeNextPath("")).toBe("/admin");
    expect(safeNextPath(null)).toBe("/admin");
  });

  it("rejects backslash and control-character tricks", () => {
    expect(safeNextPath("/\\evil.example")).toBe("/admin");
    expect(safeNextPath("/admin\\next")).toBe("/admin");
    expect(safeNextPath("/admin\r\n")).toBe("/admin");
  });

  it("accepts a custom fallback", () => {
    expect(safeNextPath("//evil.example", "/")).toBe("/");
  });
});
