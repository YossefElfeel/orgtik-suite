"use client";

import { useEffect } from "react";
import { useT } from "./i18n";

/**
 * The tab's title for a page whose name lives in the workspace (a channel, a meeting): the server
 * can't know it, so it's set here, in the reader's language ("#design · Chats", CHT-037).
 */
export function useTitle(title: string | null | undefined) {
  const t = useT();
  const app = t("suite.app.hq", "Chats");
  useEffect(() => {
    if (title) document.title = `${title} · ${app}`;
  }, [title, app]);
}
