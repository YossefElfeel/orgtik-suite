"use client";

// Rich text that people wrote (ticket messages), rendered safely (FS-HR-6, HR-004). It used to go
// straight into dangerouslySetInnerHTML, so a message could run script in everyone's session. Now
// only formatting tags survive (an allow-list, no attributes but safe links), sanitised by DOMPurify
// in the browser. The first render, which may happen on the server, shows the plain text.
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "code", "pre", "a", "h1", "h2", "h3", "h4", "hr", "span"];
const ALLOWED_ATTR = ["href", "title"];

const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export function SafeHtml({ html, className }: { html: string | null | undefined; className?: string }) {
  const [clean, setClean] = useState<string | null>(null);
  useEffect(() => {
    const out = DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
    setClean(out);
  }, [html]);

  if (clean === null) return <div className={className} dir="auto">{plain(html ?? "")}</div>;
  return <div className={className} dir="auto" dangerouslySetInnerHTML={{ __html: clean }} />;
}

// Links in user content open safely and never as javascript: (DOMPurify drops those).
if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}
