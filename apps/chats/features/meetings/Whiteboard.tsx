"use client";

/**
 * SOMION HQ - WHITEBOARD
 *
 * Real Excalidraw, the same MIT-licensed component recommended for production.
 * Boards are saved through the File Manager rather than into a store of our
 * own, which is the same rule the attachments follow.
 *
 * Loaded dynamically: it is a large dependency and nobody should pay for it
 * before opening a board.
 */

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { Skeleton } from "@/components/ui/Primitives";
import { useEffect, useRef, useState } from "react";
import { useI18n, useT } from "@/lib/i18n";

const Excalidraw = dynamic(
  async () => {
    /* Local runs serve Excalidraw's fonts themselves; without this setting it
       fetches them from its CDN as before. */
    const assetPath = process.env.NEXT_PUBLIC_EXCALIDRAW_ASSET_PATH;
    if (assetPath) (window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = assetPath;
    return (await import("@excalidraw/excalidraw")).Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col gap-3 p-4" style={{ background: "var(--color-surface)" }}>
        <Skeleton width={180} height={16} />
        <Skeleton height={200} radius="var(--radius-card)" />
      </div>
    ),
  },
);

export function Whiteboard() {
  /* The board follows the app's theme, read once when it opens. */
  const [dark] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark");
  const t = useT();
  const { locale } = useI18n();
  /* Excalidraw sets the page's lang and dir from its own language: give it the reader's. */
  const langCode = { en: "en", ar: "ar-SA", de: "de-DE", fr: "fr-FR", it: "it-IT" }[locale];
  const box = useRef<HTMLDivElement>(null);
  /* Excalidraw's main-menu button is an icon with no name. It is third-party code, so the name is
     given here, once the board has drawn it (CHT-019). */
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const label = t("whiteboard.menu", "Board menu");
    const name = () => node.querySelector(".main-menu-trigger:not([aria-label])")?.setAttribute("aria-label", label);
    name();
    const watch = new MutationObserver(name);
    watch.observe(node, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, [t]);
  return (
    <div ref={box} className="h-full w-full" style={{ background: "var(--color-surface)" }}>
      <Excalidraw
        /* Excalidraw's API takes literal colours, not CSS variables, so these two are the one place
           raw hex appears outside the token file: the brand's raised surface and ink (light). In the
           dark theme Excalidraw's own dark mode inverts them. */
        theme={dark ? "dark" : "light"}
        langCode={langCode}
        initialData={{
          appState: { viewBackgroundColor: "#FFFFFF", currentItemStrokeColor: "#190B25" },
          scrollToContent: true,
        }}
      />
    </div>
  );
}
