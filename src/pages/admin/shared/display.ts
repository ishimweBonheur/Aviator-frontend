export const label = (key: string) =>
  key
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
export function display(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
