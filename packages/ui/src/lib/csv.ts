/** Export text as data in spreadsheets; numeric values retain their numeric sign. */
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (typeof value === "string" && /^[\s\uFEFF]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function csvText(rows: readonly (readonly unknown[])[]): string {
  return rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}
