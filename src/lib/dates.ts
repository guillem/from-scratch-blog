export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "";
  }
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function formatDateIso(date: Date | string | null | undefined): string {
  if (!date) {
    return "";
  }
  return (typeof date === "string" ? new Date(date) : date).toISOString();
}
