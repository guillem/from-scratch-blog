import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { postTags, posts, tags, type Post, type Tag } from "../../db/schema";
import { conflict, notFound } from "./errors";
import { isUniqueViolation } from "./db-errors";
import { slugify } from "./slugs";
import type { PostInput } from "./validation";

export type PostWithTags = Post & { tags: Tag[] };

async function loadTagsForPosts(postIds: string[]): Promise<Map<string, Tag[]>> {
  const map = new Map<string, Tag[]>();
  if (postIds.length === 0) {
    return map;
  }
  const rows = await getDb()
    .select({
      postId: postTags.postId,
      tag: tags,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  for (const row of rows) {
    const list = map.get(row.postId) ?? [];
    list.push(row.tag);
    map.set(row.postId, list);
  }
  return map;
}

async function attachTags(postList: Post[]): Promise<PostWithTags[]> {
  const tagMap = await loadTagsForPosts(postList.map((post) => post.id));
  return postList.map((post) => ({
    ...post,
    tags: tagMap.get(post.id) ?? [],
  }));
}

export async function listPublishedPosts(): Promise<PostWithTags[]> {
  const rows = await getDb()
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
  return attachTags(rows);
}

export async function listAllPosts(): Promise<PostWithTags[]> {
  const rows = await getDb().select().from(posts).orderBy(desc(posts.updatedAt));
  return attachTags(rows);
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PostWithTags | undefined> {
  const [post] = await getDb()
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);
  if (!post) {
    return undefined;
  }
  const [withTags] = await attachTags([post]);
  return withTags;
}

export async function getPostBySlug(slug: string): Promise<PostWithTags | undefined> {
  const [post] = await getDb()
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  if (!post) {
    return undefined;
  }
  const [withTags] = await attachTags([post]);
  return withTags;
}

export async function getPostById(id: string): Promise<PostWithTags | undefined> {
  const [post] = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) {
    return undefined;
  }
  const [withTags] = await attachTags([post]);
  return withTags;
}

export async function listPublishedPostsByTagSlug(
  tagSlug: string,
): Promise<{ tag: Tag; posts: PostWithTags[] } | undefined> {
  const [tag] = await getDb()
    .select()
    .from(tags)
    .where(eq(tags.slug, tagSlug))
    .limit(1);
  if (!tag) {
    return undefined;
  }
  const rows = await getDb()
    .select({ post: posts })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
  const published = await attachTags(rows.map((row) => row.post));
  if (published.length === 0) {
    return undefined;
  }
  return { tag, posts: published };
}

async function resolveTags(names: string[]): Promise<Tag[]> {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const resolved: Tag[] = [];
  for (const name of unique) {
    const slug = slugify(name);
    const [existing] = await getDb()
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);
    if (existing) {
      resolved.push(existing);
      continue;
    }
    const [created] = await getDb().insert(tags).values({ name, slug }).returning();
    if (created) {
      resolved.push(created);
    }
  }
  return resolved;
}

async function setPostTags(postId: string, tagRecords: Tag[]): Promise<void> {
  await getDb().delete(postTags).where(eq(postTags.postId, postId));
  if (tagRecords.length === 0) {
    return;
  }
  await getDb()
    .insert(postTags)
    .values(tagRecords.map((tag) => ({ postId, tagId: tag.id })));
}

function publicationFields(status: "draft" | "published", previous?: Post) {
  if (status === "published") {
    return {
      status,
      publishedAt: previous?.publishedAt ?? new Date(),
    };
  }
  return { status, publishedAt: previous?.publishedAt ?? null };
}

export async function createPost(input: PostInput): Promise<PostWithTags> {
  const tagRecords = await resolveTags(input.tagNames);
  try {
    const [created] = await getDb()
      .insert(posts)
      .values({
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        bodyMarkdown: input.bodyMarkdown,
        ...publicationFields(input.status),
      })
      .returning();
    if (!created) {
      throw new Error("Insert returned no row.");
    }
    await setPostTags(created.id, tagRecords);
    const saved = await getPostById(created.id);
    if (!saved) {
      throw new Error("Created post could not be reloaded.");
    }
    return saved;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("That slug is already in use.");
    }
    throw error;
  }
}

export async function updatePost(id: string, input: PostInput): Promise<PostWithTags> {
  const existing = await getPostById(id);
  if (!existing) {
    throw notFound("Post not found.");
  }
  const tagRecords = await resolveTags(input.tagNames);
  try {
    const [updated] = await getDb()
      .update(posts)
      .set({
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        bodyMarkdown: input.bodyMarkdown,
        updatedAt: new Date(),
        ...publicationFields(input.status, existing),
      })
      .where(eq(posts.id, id))
      .returning();
    if (!updated) {
      throw notFound("Post not found.");
    }
    await setPostTags(id, tagRecords);
    const saved = await getPostById(id);
    if (!saved) {
      throw new Error("Updated post could not be reloaded.");
    }
    return saved;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("That slug is already in use.");
    }
    throw error;
  }
}

export async function deletePost(id: string): Promise<void> {
  const deleted = await getDb().delete(posts).where(eq(posts.id, id)).returning();
  if (deleted.length === 0) {
    throw notFound("Post not found.");
  }
}
