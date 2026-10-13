/** Export text as data in spreadsheets; numeric values retain their numeric sign. */
export function csvCell(value) {
    let text = String(value ?? "");
    if (typeof value === "string" && /^[\s\uFEFF]*[=+\-@]/.test(text))
        text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
}
export function csvText(rows) {
    return rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}
//# sourceMappingURL=csv.js.map