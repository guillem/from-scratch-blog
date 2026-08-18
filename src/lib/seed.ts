import { createPost } from "./posts";
import { createTag } from "./tags";

export async function seedDemoContent(): Promise<void> {
  const writing = await createTag({ name: "writing", slug: "writing" });
  const meta = await createTag({ name: "meta", slug: "meta" });

  await createPost({
    title: "Hello from a reusable blog",
    slug: "hello",
    summary: "A published sample post used for local development.",
    bodyMarkdown: [
      "This is a **published** development fixture.",
      "",
      "It lives in the database, not in the Git repository.",
      "",
      "```ts",
      'const greeting = "hello";',
      "```",
      "",
    ].join("\n"),
    status: "published",
    tagNames: [writing.name, meta.name],
  });

  await createPost({
    title: "A draft that must stay private",
    slug: "secret-draft",
    summary: "This draft must never appear on the public site.",
    bodyMarkdown: "If you can read this without signing in, something is wrong.",
    status: "draft",
    tagNames: [meta.name],
  });
}
