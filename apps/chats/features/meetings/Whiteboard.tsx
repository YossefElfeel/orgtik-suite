"use client";

/**
 * SOMION HQ - WHITEBOARD
 *
 * Real Excalidraw, the same MIT-licensed component recommended for production.
 * Scene changes use the vector contract; BoardScreen confirms Files-backed saves.
 *
 * Loaded dynamically: it is a large dependency and nobody should pay for it
 * before opening a board.
 */

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { Skeleton } from "@orgtik/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { encodeWhiteboardScene, sceneFingerprint, type WhiteboardScene } from "@/lib/whiteboard-scene";
import type { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { useI18n, useT } from "@/lib/i18n";

const Excalidraw = dynamic(
  async () => {
    /* Local runs serve Excalidraw's fonts themselves; without this setting it
       fetches them from its CDN as before. */
    const assetPath = process.env.NEXT_PUBLIC_EXCALIDRAW_ASSET_PATH;
    if (assetPath) (window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = assetPath;
    const vendor = await import("@excalidraw/excalidraw");
    return function HostedCanvas(props: ExcalidrawProps) {
      return <vendor.Excalidraw {...props}><vendor.MainMenu><vendor.MainMenu.DefaultItems.CommandPalette /><vendor.MainMenu.DefaultItems.ChangeCanvasBackground /><vendor.MainMenu.DefaultItems.ClearCanvas /></vendor.MainMenu></vendor.Excalidraw>;
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className={"flex h-full w-full flex-col gap-3 p-4 "+("ch-background-751d03")} >
        <Skeleton className="h-4 w-44"/>
        <Skeleton className="h-52 w-full"/>
      </div>
    ),
  },
);

export function Whiteboard({ scene, readOnly = false, onChange, onIssue }: { scene: WhiteboardScene; readOnly?: boolean; onChange?: (scene: WhiteboardScene) => void; onIssue?: (code: string | null) => void }) {
  const seed = useRef(scene).current;
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const lastFingerprint = useRef(sceneFingerprint(seed));
  const initialData = useMemo(() => ({ elements: seed.elements, appState: { ...seed.appState, currentItemStrokeColor: "#190B25" }, scrollToContent: true }), [seed]);
  const options = useMemo(() => ({ tools: { image: false }, canvasActions: { loadScene: false, saveToActiveFile: false, saveAsImage: false, export: false as const, toggleTheme: false, clearCanvas: !readOnly } }), [readOnly]);
  const reportChange = useCallback<NonNullable<ExcalidrawProps["onChange"]>>((elements, appState, files) => {
    if (appState.openSidebar?.name === "library") { apiRef.current?.toggleSidebar({ name: "library", force: false }); return; }
    if (readOnly) return;
    try {
      const value = encodeWhiteboardScene(elements, appState, files), fingerprint = sceneFingerprint(value);
      onIssue?.(null);
      if (fingerprint === lastFingerprint.current) return;
      lastFingerprint.current = fingerprint; onChange?.(value);
    } catch (error) { onIssue?.((error as Error).message || "unsupported_content"); }
  }, [readOnly, onChange, onIssue]);
  const bindApi = useCallback<NonNullable<ExcalidrawProps["excalidrawAPI"]>>(api => {
    apiRef.current = api;
    for (const name of ["hyperlink", "linkToElement", "copyElementLink", "loadScene", "addToLibrary", "setEmbeddableAsActiveTool", "saveToActiveFile", "saveFileToDisk"] as const) {
      api.registerAction({ name, label: "labels.disabled", perform: () => false, predicate: () => false, keyTest: () => false, trackEvent: false });
    }
  }, []);
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
    <div ref={box} onDragOverCapture={event => event.preventDefault()} onDropCapture={event => { event.preventDefault(); event.stopPropagation(); onIssue?.("unsupported_content"); }} onKeyDownCapture={event => { if ((event.ctrlKey || event.metaKey) && ["o", "k"].includes(event.key.toLowerCase())) { event.preventDefault(); event.stopPropagation(); onIssue?.("unsupported_content"); } }} className={"h-full w-full [&_.default-sidebar-trigger]:hidden! [&_[data-testid=toolbar-embeddable]]:hidden! [&_[data-testid=toolbar-magicframe]]:hidden! "+("ch-background-751d03")} >
      <Excalidraw
        /* Excalidraw's API takes literal colours, not CSS variables, so these two are the one place
           raw hex appears outside the token file: the brand's raised surface and ink (light). In the
           dark theme Excalidraw's own dark mode inverts them. */
        theme={dark ? "dark" : "light"}
        viewModeEnabled={readOnly}
        excalidrawAPI={bindApi}
        aiEnabled={false}
        validateEmbeddable={false}
        renderEmbeddable={() => null}
        onLinkOpen={(_element, event) => event.preventDefault()}
        UIOptions={options}
        onPaste={data => {
          if (readOnly) return false;
          try {
            if (data.mixedContent?.some(item => item.type === "imageUrl") || (data.text && /^https?:\/\//i.test(data.text.trim()))) throw new Error("unsupported_content");
            encodeWhiteboardScene(data.elements || [], scene.appState, data.files || {}); return true;
          } catch { onIssue?.("unsupported_content"); return false; }
        }}
        onChange={reportChange}
        langCode={langCode}
        initialData={initialData}
      />
    </div>
  );
}
