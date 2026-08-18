import { z } from "zod";
import { normalizeSlug } from "./slugs";

export const postStatusSchema = z.enum(["draft", "published"]);

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : undefined));

export const postInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(200),
    slug: z.string().trim().max(120).optional().default(""),
    summary: optionalText,
    bodyMarkdown: z.string().min(1, "Body is required.").max(100_000),
    status: postStatusSchema.default("draft"),
    tagNames: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  })
  .transform((value) => ({
    ...value,
    slug: normalizeSlug(value.slug, value.title),
  }))
  .refine((value) => value.slug.length > 0, {
    message: "A URL slug could not be generated from the title.",
    path: ["slug"],
  });

export const tagInputSchema = z
  .object({
    name: z.string().trim().min(1, "Tag name is required.").max(40),
    slug: z.string().trim().max(60).optional().default(""),
  })
  .transform((value) => ({
    name: value.name,
    slug: normalizeSlug(value.slug, value.name),
  }));

export type PostInput = z.infer<typeof postInputSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;

export function formString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function formTagNames(form: FormData): string[] {
  const raw = formString(form, "tags");
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parsePostForm(form: FormData): PostInput {
  return postInputSchema.parse({
    title: formString(form, "title"),
    slug: formString(form, "slug"),
    summary: formString(form, "summary"),
    bodyMarkdown: formString(form, "bodyMarkdown"),
    status: formString(form, "status") || "draft",
    tagNames: formTagNames(form),
  });
}

export function parseTagForm(form: FormData): TagInput {
  return tagInputSchema.parse({
    name: formString(form, "name"),
    slug: formString(form, "slug"),
  });
}

export function flattenZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}
