import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { excerptFromMarkdown, renderMarkdown } from "../../src/lib/markdown";

describe("renderMarkdown", () => {
  it("renders standard markdown and fenced code", () => {
    const html = renderMarkdown(
      "# Hello\n\nA **bold** word.\n\n```js\nconst n = 1;\n```\n",
    );
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<pre>");
    expect(html).toContain("const n = 1;");
  });

  it("strips raw HTML and event handlers", () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n<img src="x" onerror="alert(1)">\n<iframe src="https://evil.example"></iframe>',
    );
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onerror");
    expect(html.toLowerCase()).not.toContain("<iframe");
  });

  it("rejects javascript URLs", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html.toLowerCase()).not.toContain("javascript:");
  });
});

describe("excerptFromMarkdown", () => {
  it("returns short plain text unchanged", () => {
    expect(excerptFromMarkdown("Hello world.")).toBe("Hello world.");
  });

  it("strips fences, emphasis, and link markup", () => {
    const excerpt = excerptFromMarkdown(
      "See [docs](https://example.com) and **bold**.\n\n```js\nsecret();\n```\n",
    );
    expect(excerpt).toContain("See docs");
    expect(excerpt).toContain("bold");
    expect(excerpt).not.toContain("secret");
    expect(excerpt).not.toContain("```");
  });

  it("truncates long text with an ellipsis", () => {
    const excerpt = excerptFromMarkdown("word ".repeat(80), 40);
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(41);
  });
});

describe("sanitize-html Node 22 compatibility", () => {
  it("loads under Node require() used by Netlify functions", () => {
    const output = execFileSync(
      process.execPath,
      [
        "-e",
        "const sanitize = require('sanitize-html'); process.stdout.write(sanitize('<b>ok</b><script>x</script>'));",
      ],
      { encoding: "utf8" },
    );
    expect(output).toContain("<b>ok</b>");
    expect(output.toLowerCase()).not.toContain("<script");
  });
});
