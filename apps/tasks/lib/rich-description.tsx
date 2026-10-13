import { createElement, type ReactNode } from "react";
const tags = new Set(["p", "strong", "b", "em", "i", "ul", "ol", "li", "blockquote", "pre", "code", "br", "a"]);
export const isRichDescription = (text: string) => /^\s*<(?:p|ul|ol|blockquote|pre)\b/i.test(text);
export function editableDescription(text: string): string {
  return isRichDescription(text) ? text : text.split("\n").map(line => `<p>${line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>`).join("");
}
/** Build React nodes from the supported document grammar, without executing or injecting HTML. */
export function richDescription(text: string): ReactNode[] {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const render = (node: Node, key: string): ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (!(node instanceof Element) || ["script", "style", "iframe", "object"].includes(node.tagName.toLowerCase())) return null;
    const tag = node.tagName.toLowerCase(), children = [...node.childNodes].map((child, index) => render(child, `${key}:${index}`));
    if (!tags.has(tag)) return children;
    const href = node.getAttribute("href") || "", props = tag === "a" && /^(https?:\/\/|mailto:)/i.test(href) ? { href, target: "_blank", rel: "noopener noreferrer", className: "text-fg-brand underline" } : {};
    return createElement(tag === "a" && !("href" in props) ? "span" : tag, { ...props, key }, ...children);
  };
  return [...doc.body.childNodes].map((node, index) => render(node, String(index)));
}
