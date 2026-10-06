/** A template body as plain text, for lists and previews (email bodies are HTML). */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
