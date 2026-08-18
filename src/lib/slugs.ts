import { slug as githubSlug } from "github-slugger";

export function slugify(value: string): string {
  return githubSlug(value.trim());
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function normalizeSlug(value: string, fallback = ""): string {
  const trimmed = value.trim().toLowerCase();
  if (isValidSlug(trimmed)) {
    return trimmed;
  }
  return slugify(fallback || value);
}
