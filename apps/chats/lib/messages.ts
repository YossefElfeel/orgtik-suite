/**
 * ICU-lite message formatting, shared by the server (page titles) and the client (t()): `{name}`
 * fills a value; `{n, plural, one {# person} other {# people}}` picks the reader's plural form.
 */

export type Vars = Record<string, string | number>;

/** Finds the end of a {…} group that starts at `open`, respecting nesting. */
function closing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/** Fills {var} and {var, plural, …} in a message. */
export function formatMessage(message: string, vars: Vars | undefined, locale: string): string {
  if (!vars || !message.includes("{")) return message;
  let out = "";
  let i = 0;
  while (i < message.length) {
    const open = message.indexOf("{", i);
    if (open < 0) {
      out += message.slice(i);
      break;
    }
    out += message.slice(i, open);
    const close = closing(message, open);
    if (close < 0) {
      out += message.slice(open);
      break;
    }
    const body = message.slice(open + 1, close);
    const plural = body.match(/^\s*(\w+)\s*,\s*plural\s*,([\s\S]*)$/);
    if (plural) {
      const name = plural[1] ?? "";
      const rest = plural[2] ?? "";
      const n = Number(vars[name] ?? 0);
      const forms: Record<string, string> = {};
      const re = /\s*(=\d+|zero|one|two|few|many|other)\s*\{/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(rest))) {
        const start = m.index + m[0].length - 1;
        const end = closing(rest, start);
        if (end < 0) break;
        forms[m[1] ?? "other"] = rest.slice(start + 1, end);
        re.lastIndex = end + 1;
      }
      const form = forms[`=${n}`] ?? forms[new Intl.PluralRules(locale).select(n)] ?? forms.other ?? "";
      out += formatMessage(form.replaceAll("#", new Intl.NumberFormat(locale).format(n)), vars, locale);
    } else {
      const name = body.trim();
      out += name in vars ? String(vars[name]) : `{${body}}`;
    }
    i = close + 1;
  }
  return out;
}

/** A message to translate later, where it is shown (a toast queued by the store). */
export type Msg = { key: string; text: string; vars?: Vars };
export const msg = (key: string, text: string, vars?: Vars): Msg => ({ key, text, vars });

/**
 * Declares the English default of a key that call sites build at run time, such as
 * t(`status.${id}`, meta.label): returns the text unchanged, and lets the extractor see the pair.
 */
export const msgText = (_key: string, text: string): string => text;
