import { count, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { postTags, posts, tags, type Tag } from "../../db/schema";
import { conflict, notFound } from "./errors";
import { isUniqueViolation } from "./db-errors";
import type { TagInput } from "./validation";

export type TagWithCount = Tag & { postCount: number };

export async function listTags(): Promise<TagWithCount[]> {
  const rows = await getDb()
    .select({
      tag: tags,
      postCount: count(postTags.postId),
    })
    .from(tags)
    .leftJoin(postTags, eq(tags.id, postTags.tagId))
    .groupBy(tags.id)
    .orderBy(tags.name);
  return rows.map((row) => ({ ...row.tag, postCount: Number(row.postCount) }));
}

export async function listTagsUsedByPublishedPosts(): Promise<TagWithCount[]> {
  const rows = await getDb()
    .select({
      tag: tags,
      postCount: count(posts.id),
    })
    .from(tags)
    .innerJoin(postTags, eq(tags.id, postTags.tagId))
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(eq(posts.status, "published"))
    .groupBy(tags.id)
    .orderBy(tags.name);
  return rows.map((row) => ({ ...row.tag, postCount: Number(row.postCount) }));
}

export async function createTag(input: TagInput): Promise<Tag> {
  try {
    const [created] = await getDb().insert(tags).values(input).returning();
    if (!created) {
      throw new Error("Insert returned no row.");
    }
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("A tag with that name or slug already exists.");
    }
    throw error;
  }
}

export async function deleteTag(id: string): Promise<void> {
  const deleted = await getDb().delete(tags).where(eq(tags.id, id)).returning();
  if (deleted.length === 0) {
    throw notFound("Tag not found.");
  }
}
