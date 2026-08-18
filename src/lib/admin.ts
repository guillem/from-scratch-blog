import type { AppUser } from "./auth";
import { assertAdmin } from "./auth";
import { createPost, deletePost, updatePost } from "./posts";
import { createTag, deleteTag } from "./tags";
import type { PostInput, TagInput } from "./validation";

export async function createPostAsAdmin(user: AppUser | null, input: PostInput) {
  assertAdmin(user);
  return createPost(input);
}

export async function updatePostAsAdmin(
  user: AppUser | null,
  id: string,
  input: PostInput,
) {
  assertAdmin(user);
  return updatePost(id, input);
}

export async function deletePostAsAdmin(user: AppUser | null, id: string) {
  assertAdmin(user);
  return deletePost(id);
}

export async function createTagAsAdmin(user: AppUser | null, input: TagInput) {
  assertAdmin(user);
  return createTag(input);
}

export async function deleteTagAsAdmin(user: AppUser | null, id: string) {
  assertAdmin(user);
  return deleteTag(id);
}
