// CSV export (FS-HR-9, HR-010). UTF-8 with a byte-order mark, so Excel opens Arabic and accented
// names correctly; every cell quoted; and a cell that starts like a formula (= + - @, a tab or a
// carriage return) is prefixed with an apostrophe, so a spreadsheet shows it instead of running it.

import { csvCell as cell } from "@orgtik/ui";

export function toCsv(header: string[], rows: unknown[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Hands the browser a CSV file to save. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
