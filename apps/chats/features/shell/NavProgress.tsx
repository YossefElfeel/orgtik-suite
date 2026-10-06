"use client";

/**
 * SOMION HQ - NAVIGATION PROGRESS
 *
 * A route change is not instant, least of all on a development server that
 * compiles the next page on demand. Between the click and the new page there
 * was nothing on screen to say the click had landed. This is that something:
 * a two-pixel bar across the top from the moment an in-app link is pressed
 * until the path changes.
 *
 * It listens to clicks rather than to the router, because the app router has
 * no navigation events, and a link is what almost every navigation here is.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

export function NavProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const t = useT();

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setPending(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /* A navigation that never completes must not leave a bar forever. */
  useEffect(() => {
    if (!pending) return;
    const off = setTimeout(() => setPending(false), 10_000);
    return () => clearTimeout(off);
  }, [pending]);

  if (!pending) return null;
  return <div role="progressbar" aria-label={t("shell.loadingPage", "Loading the next page")} className="hq-navbar fixed inset-x-0 top-0 z-[80]" />;
}
