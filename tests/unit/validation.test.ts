import { describe, expect, it } from "vitest";
import { postInputSchema, tagInputSchema } from "../../src/lib/validation";

describe("postInputSchema", () => {
  it("rejects empty titles and bodies", () => {
    const result = postInputSchema.safeParse({
      title: "  ",
      bodyMarkdown: "",
    });
    expect(result.success).toBe(false);
  });

  it("generates a slug from the title", () => {
    const result = postInputSchema.parse({
      title: "Hello World",
      bodyMarkdown: "Body",
    });
    expect(result.slug).toBe("hello-world");
    expect(result.status).toBe("draft");
  });

  it("rejects invalid status values", () => {
    const result = postInputSchema.safeParse({
      title: "Hello",
      bodyMarkdown: "Body",
      status: "public",
    });
    expect(result.success).toBe(false);
  });
});

describe("tagInputSchema", () => {
  it("requires a name", () => {
    expect(tagInputSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
