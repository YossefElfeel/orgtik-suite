"use client";

// A task's description as people wrote it, with its links and mentions. Links open outside the app
// and only for web and mail addresses; a mention reads as the person's name. The old renderer linked
// mentions to a people page Tasks doesn't have (TASKS-041).
import { useEffect, useState, type ReactNode } from "react";
import { isRichDescription, richDescription } from "@/lib/rich-description";

type Person = { id: number | string; firstName?: string; lastName?: string };
const TOKEN = /(@\[(\d+)\])|((?:https?:\/\/|www\.)[^\s<>()]+|mailto:[^\s<>()]+)/g;

export function RichText({ text, people = [], className }: { text: string; people?: Person[]; className?: string }) {
  const [rich, setRich] = useState<ReactNode[] | null>(null);
  useEffect(() => { setRich(isRichDescription(text) ? richDescription(text) : null); }, [text]);
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    if (m[2]) {
      const p = people.find((x) => String(x.id) === m[2]);
      nodes.push(
        <span key={at} className="rounded-sm bg-brand-subtle px-1 font-semibold text-fg-brand">
          @{p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : m[2]}
        </span>,
      );
    } else if (m[3]) {
      // Trailing punctuation belongs to the sentence, not the address.
      const raw = m[3].replace(/[).,;:!?]+$/, "");
      const href = raw.startsWith("www.") ? `https://${raw}` : raw;
      nodes.push(
        <a key={at} href={href} target="_blank" rel="noreferrer noopener" dir="ltr" className="break-all text-fg-brand underline focus-visible:outline-2 focus-visible:outline-focus">
          {raw}
        </a>,
      );
      if (raw.length < m[3].length) nodes.push(m[3].slice(raw.length));
    }
    last = at + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  if (isRichDescription(text)) return <div dir="auto" className={className || "ot-rich-text text-body text-fg"}>{rich || text.replace(/<[^>]*>/g, "")}</div>;
  return (
    <p dir="auto" className={className ?? "whitespace-pre-wrap text-body text-fg"}>
      {nodes}
    </p>
  );
}
