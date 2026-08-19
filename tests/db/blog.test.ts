import { describe, expect, it } from "vitest";
import "./setup";
import {
  createPostAsAdmin,
  createTagAsAdmin,
  deletePostAsAdmin,
  deleteTagAsAdmin,
  updatePostAsAdmin,
} from "../../src/lib/admin";
import {
  getPostById,
  getPostBySlug,
  getPublishedPostBySlug,
  listPublishedPosts,
  listPublishedPostsByTagSlug,
} from "../../src/lib/posts";
import type { AppUser } from "../../src/lib/auth";
import { seedDemoContent } from "../../src/lib/seed";
import {
  createTag,
  deleteTag,
  listTags,
  listTagsUsedByPublishedPosts,
} from "../../src/lib/tags";

const admin: AppUser = { id: "admin", email: "admin@example.com", roles: ["admin"] };
const stranger: AppUser = { id: "user", email: "user@example.com", roles: [] };

const published = {
  title: "Public post",
  slug: "public-post",
  summary: "A published fixture.",
  bodyMarkdown: "Hello **world**.",
  status: "published" as const,
  tagNames: ["writing"],
};

const draft = {
  title: "Secret draft",
  slug: "secret-draft",
  summary: "Hidden.",
  bodyMarkdown: "Not for the public.",
  status: "draft" as const,
  tagNames: ["writing"],
};

describe("posts and tags", () => {
  it("rejects unauthenticated and non-admin writes", async () => {
    await expect(createPostAsAdmin(null, published)).rejects.toThrow(
      /Authentication required/,
    );
    await expect(createPostAsAdmin(stranger, published)).rejects.toThrow(
      /Administrator access required/,
    );
  });

  it("creates published posts that are publicly visible", async () => {
    const created = await createPostAsAdmin(admin, published);
    const listed = await listPublishedPosts();
    const fetched = await getPublishedPostBySlug("public-post");
    expect(listed.map((post) => post.slug)).toContain("public-post");
    expect(fetched?.id).toBe(created.id);
    expect((await getPostById(created.id))?.slug).toBe("public-post");
    expect(fetched?.tags.map((tag) => tag.slug)).toContain("writing");
  });

  it("keeps drafts out of public listings and public permalinks", async () => {
    await createPostAsAdmin(admin, draft);
    const listed = await listPublishedPosts();
    expect(listed.map((post) => post.slug)).not.toContain("secret-draft");
    expect(await getPublishedPostBySlug("secret-draft")).toBeUndefined();
    expect(await getPostBySlug("secret-draft")).toMatchObject({ status: "draft" });
  });

  it("enforces slug uniqueness", async () => {
    await createPostAsAdmin(admin, published);
    await expect(createPostAsAdmin(admin, published)).rejects.toThrow(/already in use/);
  });

  it("rejects invalid input before writing", async () => {
    await expect(
      createPostAsAdmin(admin, {
        ...published,
        title: "",
      }),
    ).rejects.toThrow();
  });

  it("updates, unpublishes, and deletes posts", async () => {
    const created = await createPostAsAdmin(admin, published);
    const updated = await updatePostAsAdmin(admin, created.id, {
      ...published,
      title: "Renamed",
      status: "draft",
    });
    expect(updated.title).toBe("Renamed");
    expect(await getPublishedPostBySlug("public-post")).toBeUndefined();
    await deletePostAsAdmin(admin, created.id);
    expect(await getPostBySlug("public-post")).toBeUndefined();
  });

  it("filters published posts by tag and cascades tag deletion to join rows", async () => {
    await createPostAsAdmin(admin, published);
    const tagged = await listPublishedPostsByTagSlug("writing");
    expect(tagged?.posts).toHaveLength(1);
    const [tag] = await listTags();
    await deleteTag(tag.id);
    expect(await listPublishedPostsByTagSlug("writing")).toBeUndefined();
    expect(await getPublishedPostBySlug("public-post")).toMatchObject({
      tags: [],
    });
  });

  it("hides tags that only appear on drafts", async () => {
    await createPostAsAdmin(admin, {
      ...draft,
      slug: "draft-tagged",
      tagNames: ["secret-topic"],
    });
    expect(await listPublishedPostsByTagSlug("secret-topic")).toBeUndefined();
    expect((await listTags()).map((tag) => tag.slug)).toContain("secret-topic");
    expect((await listTagsUsedByPublishedPosts()).map((tag) => tag.slug)).not.toContain(
      "secret-topic",
    );
  });

  it("creates tags with unique slugs", async () => {
    await createTag({ name: "Meta", slug: "meta" });
    await expect(createTag({ name: "Meta", slug: "meta" })).rejects.toThrow(
      /already exists/,
    );
  });

  it("seeds published and draft fixtures", async () => {
    await seedDemoContent();
    expect(await getPublishedPostBySlug("hello")).toMatchObject({
      status: "published",
    });
    expect(await getPublishedPostBySlug("secret-draft")).toBeUndefined();
    expect(await getPostBySlug("secret-draft")).toMatchObject({ status: "draft" });
  });

  it("creates and deletes tags through admin helpers", async () => {
    const created = await createTagAsAdmin(admin, { name: "Ops", slug: "ops" });
    expect(created.slug).toBe("ops");
    await expect(
      createTagAsAdmin(stranger, { name: "Nope", slug: "nope" }),
    ).rejects.toThrow(/Administrator access required/);
    await deleteTagAsAdmin(admin, created.id);
    expect((await listTags()).map((tag) => tag.slug)).not.toContain("ops");
  });
});
