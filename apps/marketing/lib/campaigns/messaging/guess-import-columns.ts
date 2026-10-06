function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function findHeader(
  headers: string[],
  candidates: string[],
): string | undefined {
  const normalizedCandidates = new Set(candidates.map(normalizeHeader));
  return headers.find((header) =>
    normalizedCandidates.has(normalizeHeader(header)),
  );
}

export function guessAudienceImportColumns(headers: string[]): {
  nameColumn: string;
  emailColumn: string;
  phoneColumn: string;
} {
  return {
    nameColumn:
      findHeader(headers, [
        "name",
        "fullname",
        "full name",
        "contact name",
        "customer name",
      ]) ??
      headers[0] ??
      "",
    emailColumn:
      findHeader(headers, ["email", "email address", "e-mail", "mail"]) ?? "",
    phoneColumn:
      findHeader(headers, [
        "phone",
        "phone number",
        "mobile",
        "mobile number",
        "tel",
        "telephone",
      ]) ?? "",
  };
}
