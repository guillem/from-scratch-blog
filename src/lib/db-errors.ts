function errorChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return chain;
}

export function isUniqueViolation(error: unknown): boolean {
  for (const item of errorChain(error)) {
    if (
      typeof item === "object" &&
      item !== null &&
      "code" in item &&
      (item as { code?: string }).code === "23505"
    ) {
      return true;
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  return /23505|duplicate key|unique constraint/i.test(message);
}
