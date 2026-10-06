// Comment text on the wire and in the editor.
// The API stores a mention as "@[42]" (it notifies person 42). People type and read "@Mona Adel",
// so the editor holds names and remembers which names were picked from the list; on send each
// picked name goes back to its "@[id]" token.
import type { IProjectMember } from "@/types/projects";

export type PickedMention = { id: number; label: string };

export const fullName = (p: { firstName?: string | null; lastName?: string | null }) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ").trim();

const TOKEN = /@\[(\d+)\]/g;

/** "@[42] look" → "@Mona Adel look", plus the mentions it contained (for editing a comment). */
export function toEditable(content: string, members: IProjectMember[]): { text: string; mentions: PickedMention[] } {
  const mentions: PickedMention[] = [];
  const text = (content ?? "").replace(TOKEN, (raw, id: string) => {
    const m = members.find((x) => String(x.id) === id);
    if (!m) return raw; // someone no longer in the project: keep the token, it saves back unchanged
    const label = fullName(m);
    if (!mentions.some((x) => x.id === m.id)) mentions.push({ id: m.id, label });
    return `@${label}`;
  });
  return { text, mentions };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The editor's text back to what the API expects: each picked "@Name" becomes "@[id]". */
export function toPayload(text: string, mentions: PickedMention[]): string {
  let out = text;
  // Longest names first, so "@Ann Lee" isn't eaten by a shorter "@Ann".
  for (const m of [...mentions].sort((a, b) => b.label.length - a.label.length)) {
    if (!m.label) continue;
    out = out.replace(new RegExp(`@${escape(m.label)}(?![\\p{L}\\p{N}_])`, "gu"), `@[${m.id}]`);
  }
  return out.trim();
}

/** The "@query" being typed right before the caret, if any. */
export function mentionAt(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  // "@" must start a word (not "mail@host"), and the query is one word so far.
  if (at > 0 && !/\s|[([{"'«]/u.test(before[at - 1])) return null;
  const query = before.slice(at + 1);
  if (!/^[\p{L}\p{N}_.-]*$/u.test(query) || query.length > 40) return null;
  return { start: at, query };
}

export type Piece =
  | { kind: "text"; value: string }
  | { kind: "mention"; id: number }
  | { kind: "link"; href: string; label: string };

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** A URL only when it parses and its protocol is safe; anything else stays text. */
export function safeHref(raw: string): string | null {
  const candidate = /^www\./i.test(raw) ? `https://${raw}` : raw;
  try {
    const url = new URL(candidate);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

const PIECES = /@\[(\d+)\]|((?:https?:\/\/|mailto:|www\.)[^\s<>"]+)/gi;

/** Splits a stored comment into text, mentions and links. Links lose trailing punctuation. */
export function parseComment(content: string): Piece[] {
  const text = content ?? "";
  const out: Piece[] = [];
  const push = (value: string) => {
    if (!value) return;
    const last = out[out.length - 1];
    if (last?.kind === "text") last.value += value;
    else out.push({ kind: "text", value });
  };
  let i = 0;
  for (const m of text.matchAll(PIECES)) {
    const at = m.index ?? 0;
    push(text.slice(i, at));
    if (m[1]) {
      out.push({ kind: "mention", id: Number(m[1]) });
    } else {
      const raw = m[2];
      const trail = raw.match(/[)\].,;:!?'"]+$/)?.[0] ?? "";
      const label = trail ? raw.slice(0, -trail.length) : raw;
      const href = safeHref(label);
      if (href) out.push({ kind: "link", href, label });
      else push(label);
      push(trail);
    }
    i = at + m[0].length;
  }
  push(text.slice(i));
  return out;
}

// Same rules as the spec (CON-001, REQ-003): no executables or scripts, 25 MB a file.
export const BLOCKED_EXTENSIONS = ["exe", "bat", "sh", "cmd", "msi", "com", "scr", "vbs", "jar", "bin"];
export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const isBlocked = (file: File) => BLOCKED_EXTENSIONS.includes(file.name.split(".").pop()?.toLowerCase() ?? "");

/** Only http(s) or same-origin paths go into src attributes. */
export function safeFileUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
