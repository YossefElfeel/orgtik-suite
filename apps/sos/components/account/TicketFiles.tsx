"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, useSuite } from "@orgtik/ui";
import { useAccountResource } from "./useAccount";
import { AccountState } from "./AccountState";
import { AccountFilePicker } from "./AccountFilePicker";
import { AccountFileLink } from "./AccountFileLink";
import type { AccountFileReference } from "@/types/file-references";
type Attachment = { reference: AccountFileReference; name: string; state: "available" | "unavailable" };
export function TicketFiles({ ticketId }: { ticketId: string }) {
  const t = useTranslations("Roadmap"), suite = useSuite(), path = `/support/tickets/${encodeURIComponent(ticketId)}/files`, resource = useAccountResource<Attachment[]>("suite:" + path);
  const [picked, setPicked] = useState<AccountFileReference | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  useEffect(() => { setPicked(null); setError(false); }, [ticketId, suite.snapshot?.workspace.id]);
  const readOnly = Boolean(suite.snapshot?.actor.readOnly || ["suspended", "cancelled", "deleted"].includes(suite.snapshot?.workspace.state || ""));
  return <section className="flex flex-col gap-4"><h2 className="text-title-sm font-semibold">{t("attachments")}</h2><AccountState loading={resource.loading} error={resource.error} retry={resource.refetch}><div className="flex flex-wrap gap-3">{resource.data?.map(item => item.state === "available" ? <AccountFileLink key={item.reference.fileId + item.reference.versionId} reference={item.reference} name={item.name} /> : <p key={item.reference.fileId + item.reference.versionId} className="text-caption text-fg-muted">{t("fileError")}</p>)}</div>{suite.accessibleTools.includes("files") && !readOnly ? <><Field label={t("attachments")}><AccountFilePicker disabled={busy || (resource.data?.length || 0) >= 10} onPick={setPicked} /></Field><Button className="self-start" variant="secondary" loading={busy} disabled={!picked} onClick={async () => { if (!picked) return; setBusy(true); setError(false); try { await suite.request(path, "PUT", { refs: [...(resource.data || []).map(item => item.reference), picked] }); await resource.refetch(); setPicked(null); } catch { setError(true); } finally { setBusy(false); } }}>{t("add")}</Button></> : null}{error ? <p role="alert" className="text-danger">{t("saveError")}</p> : null}</AccountState></section>;
}
