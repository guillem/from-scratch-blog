import { describe, expect, it } from "vitest";
import {
  flattenZodError,
  parsePostForm,
  parseTagForm,
  postInputSchema,
  tagInputSchema,
} from "../../src/lib/validation";

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

describe("form parsers", () => {
  it("parses post fields and comma-separated tags", () => {
    const form = new FormData();
    form.set("title", "Hello World");
    form.set("bodyMarkdown", "Body");
    form.set("summary", "  A summary  ");
    form.set("tags", "writing, meta, ");
    form.set("status", "published");
    const parsed = parsePostForm(form);
    expect(parsed.slug).toBe("hello-world");
    expect(parsed.summary).toBe("A summary");
    expect(parsed.tagNames).toEqual(["writing", "meta"]);
    expect(parsed.status).toBe("published");
  });

  it("parses a tag form and generates a slug", () => {
    const form = new FormData();
    form.set("name", "New Topic");
    expect(parseTagForm(form)).toEqual({ name: "New Topic", slug: "new-topic" });
  });

  it("flattens Zod issues into one message", () => {
    const result = postInputSchema.safeParse({ title: "", bodyMarkdown: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(flattenZodError(result.error)).toMatch(/required/i);
    }
  });
});
