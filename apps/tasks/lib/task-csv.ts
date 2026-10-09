/** Bounded text CSV reader shared by ordinary Tasks import and historical presentation. */
export function parseTaskCsv(text: string): string[][] {
  const rows: string[][] = [], row: string[] = []; let value = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else if (quoted || !value) quoted = !quoted;
      else value += char;
    } else if (!quoted && (char === "," || char === "\n" || char === "\r")) {
      row.push(value); value = "";
      if (char !== ",") { if (char === "\r" && text[i + 1] === "\n") i++; if (row.some(x => x.trim())) rows.push([...row]); row.length = 0; }
    } else value += char;
  }
  if (quoted) throw new Error("csv");
  row.push(value); if (row.some(x => x.trim())) rows.push(row);
  return rows;
}
