"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, suiteApiRoot, useSuite } from "@orgtik/ui";
import { readClientSession } from "@orgtik/ui/auth";
import type { AccountFileReference } from "@/types/file-references";
export function AccountFileLink({ reference, name }: { reference: AccountFileReference; name?: string }) {
  const t = useTranslations("Roadmap"), suite = useSuite(), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  return <div className="flex flex-col gap-2"><Button size="sm" variant="secondary" loading={busy} onClick={async () => {
    const session = readClientSession(); setBusy(true); setError(false);
    try { if (session?.workspaceContext?.workspace.id !== reference.workspaceId) throw Error("workspace_changed"); const response = await fetch(`${suiteApiRoot(suite.apiUrl || "")}/files/${encodeURIComponent(reference.fileId)}/versions/${encodeURIComponent(reference.versionId)}/content`, { headers: { Authorization: "Bearer " + session.tokens.accessToken } }); if (!response.ok || readClientSession()?.tokens.accessToken !== session.tokens.accessToken) throw Error("file_unavailable"); const url = URL.createObjectURL(await response.blob()), link = document.createElement("a"); link.href = url; link.download = name || reference.fileId; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { setError(true); } finally { setBusy(false); }
  }}>{name || t("attachments")}</Button>{error ? <p role="alert" className="text-caption text-danger">{t("fileError")}</p> : null}</div>;
}
