"use client";

/**
 * SOMION HQ - LINK PREVIEW
 *
 * A URL in a message gets a small card under it: the site, a title, the
 * path. In the product the card endpoint fetches the page's own title and
 * image; here a short table stands in for the sites the team actually
 * pastes. The card is a link and nothing more.
 */

import { ArrowSquareOut } from "@phosphor-icons/react";

export const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/g;

const KNOWN: { host: RegExp; site: string; title: (u: URL) => string }[] = [
  { host: /figma\.com$/, site: "Figma", title: (u) => decodeURIComponent(u.pathname.split("/").pop() ?? "Design file").replace(/-/g, " ") },
  { host: /github\.com$/, site: "GitHub", title: (u) => u.pathname.split("/").filter(Boolean).slice(0, 2).join(" / ") || "Repository" },
  { host: /docs\.google\.com$/, site: "Google Docs", title: () => "Shared document" },
  { host: /notion\.so$/, site: "Notion", title: (u) => decodeURIComponent(u.pathname.split("/").pop() ?? "Page").replace(/-/g, " ") },
  { host: /somion\.org$/, site: "Somion", title: (u) => (u.pathname === "/" ? "Somion Business OS" : u.pathname.replace(/^\//, "").replace(/[-/]/g, " ")) },
];

export function describeLink(raw: string): { site: string; title: string; host: string } | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    const known = KNOWN.find((k) => k.host.test(host));
    return known ? { site: known.site, title: known.title(u), host } : { site: host, title: u.pathname === "/" ? host : u.pathname.replace(/^\//, ""), host };
  } catch {
    return null;
  }
}

export function LinkPreview({ url }: { url: string }) {
  const info = describeLink(url);
  if (!info) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={"hq-row mt-1.5 flex max-w-[480px] items-center gap-3 px-3 py-2 "+("ch-border-5065d4"+' '+"ch-border-radius-332348"+' '+"ch-background-751d03"+' '+"ch-text-decoration-80d654")}

    >
      <span
        aria-hidden="true"
        className={"flex shrink-0 items-center justify-center text-caption font-semibold "+("ch-width-82b9d8"+' '+"ch-height-268b76"+' '+"ch-border-radius-edd97e"+' '+"ch-background-314b28"+' '+"ch-color-4a0211")}

      >
        {info.site.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className={"block truncate text-body-sm font-medium "+("ch-color-7f7330")} >
          <bdi>{info.title}</bdi>
        </span>
        <span className={"block truncate text-caption "+("ch-color-4a0211")} >
          {info.site} · {info.host}
        </span>
      </span>
      <ArrowSquareOut size={13} aria-hidden="true" className={"ch-color-094083"}  />
    </a>
  );
}
