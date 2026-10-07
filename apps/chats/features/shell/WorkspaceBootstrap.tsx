"use client";

import { useEffect, type ReactNode } from "react";
import { Button, LoadingState } from "@orgtik/ui";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/store";
import { currentWorkspaceNamespace, reloadWorkspace, startWorkspacePlatform } from "@/store/platform";
import { SOS_URL } from "@/lib/suite-session";

/** Hide the previous namespace before any shell selector can render it. */
export function WorkspaceBootstrap({ children }: { children: ReactNode }) {
  const t = useT();
  const sync = useWorkspace(state => state.workspaceSync);
  const viewOnly = useWorkspace(state => state.viewOnly);
  useEffect(() => startWorkspacePlatform({
    clear: state => useWorkspace.getState().clearWorkspace(state),
    hydrate: (data, state) => useWorkspace.getState().hydrateWorkspace(data, state),
    status: state => useWorkspace.getState().setWorkspaceSync(state),
  }), []);
  if (sync.status === "loading" || sync.namespace !== currentWorkspaceNamespace()) return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><LoadingState label={t("workspace.loading", "Loading workspace conversations…")} /></main>;
  if (sync.status !== "ready") return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold">{sync.status === "no_access" ? t("workspace.noAccess", "Chats is unavailable in this workspace") : t("workspace.loadFailed", "Workspace conversations couldn’t be loaded")}</h1>
        <p className="text-sm text-ink-muted">{sync.status === "no_access" ? t("workspace.noAccessBody", "Choose a workspace where you have access to Chats. Meeting guests can use their invitation link.") : t("workspace.loadFailedBody", "Your saved conversations are still on the server. Retry to check the latest result before sending again.")}</p>
        <Button onClick={() => { if (sync.status === "no_access") window.location.assign(SOS_URL || "/"); else void reloadWorkspace(); }}>{sync.status === "no_access" ? t("workspace.openSuite", "Open workspace launcher") : t("workspace.retry", "Retry")}</Button>
      </div>
    </main>
  );
  return <>
    {!sync.canWrite && !viewOnly && <aside role="status" className="border-b border-line bg-raised px-4 py-3 text-sm"><p className="font-medium">{t("toast.readOnly", "Changes are turned off")}</p><p className="mt-1 text-ink-muted">{t("toast.readOnlyBody", "This workspace is read-only. You can read conversations, but changes are turned off.")}</p></aside>}
    {sync.pending > 0 && <div role="status" className="border-b border-line bg-raised px-4 py-2 text-sm text-ink-muted">{t("workspace.saving", "Saving to this workspace…")}</div>}
    {sync.errorCode === "chat_flow_deferred" && <aside role="status" className="border-b border-line bg-raised px-4 py-3 text-sm"><p className="font-medium">{t("workspace.deferred", "This mock flow will be connected in a later release")}</p><p className="mt-1 text-ink-muted">{t("workspace.deferredBody", "Channels, messages, membership and read state are saved. Live media and the remaining meeting flows are still deferred.")}</p></aside>}
    {children}
  </>;
}
