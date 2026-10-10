import type { CrmContact, CrmContactInput, CrmLabel } from "@/types/crm-v3";
export const crmLabel = (value: CrmLabel | undefined, locale: string) =>
  typeof value === "string" ? value : value?.[locale] || value?.en || "";
export function crmTaskState(value: string) {
  if (value === "completed") return "done";
  if (
    value === "backlog" ||
    value === "todo" ||
    value === "in_progress" ||
    value === "in_review" ||
    value === "done"
  )
    return value;
  return undefined;
}
export function crmCsv(contacts: CrmContact[]) {
  const quote = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    ["name", "email", "company", "phone", "country", "value", "source", "tags"],
    ...contacts.map((row) => [
      row.fullName,
      row.email,
      row.companyName,
      row.phoneNumber,
      row.countryCode,
      row.value,
      row.source,
      row.tags.join("|"),
    ]),
  ]
    .map((row) => row.map(quote).join(","))
    .join("\r\n");
}
export function parseCrmCsv(text: string): string[][] {
  if (text.length > 100000) throw Error("importLimit");
  const rows: string[][] = [],
    row: string[] = [];
  let value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(value);
      value = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push([...row]);
      row.length = 0;
      value = "";
    } else value += char;
  }
  if (quoted) throw Error("csvInvalid");
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push([...row]);
  if (rows.length > 201) throw Error("importLimit");
  return rows;
}
export function mappedCrmCsv(
  rows: string[][],
  mapping: Record<string, string>,
): CrmContactInput[] {
  const headers = rows[0] || [],
    index = (key: string) => headers.indexOf(mapping[key] || key),
    read = (row: string[], key: string) => row[index(key)] || "";
  return rows.slice(1).map((row) => ({
    fullName: read(row, "name"),
    email: read(row, "email"),
    companyName: read(row, "company"),
    phoneNumber: read(row, "phone"),
    countryCode: read(row, "country") || "EG",
    value: read(row, "value").trim() ? Number(read(row, "value")) : 0,
  }));
}
export function crmErrorStatus(error: unknown) {
  return error && typeof error === "object" && "status" in error
    ? error.status
    : undefined;
}
