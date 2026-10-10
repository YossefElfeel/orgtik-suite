"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Checkbox, PageHeader, SUITE_TOOLS, useSuite } from "@orgtik/ui";
import { AccountState, useAccountProblem } from "./AccountState";
export function AccountConnections() {
  const t = useTranslations("AccountV3"), locale = useLocale() as "en", suite = useSuite(), [error, setError] = useState<unknown>(), [notice, setNotice] = useState(""), problem = useAccountProblem();
  const canManage = ["owner", "admin"].includes(suite.snapshot?.member.role || "") && !suite.snapshot?.actor.readOnly && !["suspended", "cancelled", "deleted"].includes(suite.snapshot?.workspace.state || "");
  if (!suite.snapshot?.connectors || suite.error) return <AccountState loading={!suite.error} error={suite.error} retry={suite.refresh || (() => Promise.resolve())}><></></AccountState>;
  return <section className="flex flex-col gap-5"><PageHeader title={t("connections")} description={t("connectionIntro")} /><ul className="divide-y divide-line rounded-card border border-line bg-raised">{suite.snapshot?.connectors?.map(connector => <li key={connector.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="min-w-0 flex-1"><h2 className="text-body font-semibold">{SUITE_TOOLS[connector.source].labels[locale]} · {SUITE_TOOLS[connector.target].labels[locale]}</h2><p className="mt-1 text-body-sm text-fg-muted">{t.has(`connectorDescriptions.${connector.id}`) ? t(`connectorDescriptions.${connector.id}`) : t("connectionIntro")}</p>{!suite.hasTool(connector.source) || !suite.hasTool(connector.target) ? <Link href="/tools" className="mt-2 inline-block text-body-sm text-fg-brand underline">{t("addTool")}</Link> : null}</div><Checkbox label={t("enabled")} checked={connector.enabled} disabled={!canManage} onCheckedChange={enabled => { setNotice(""); setError(undefined); void suite.mutate(`/connectors/${connector.id}`, "PATCH", { enabled }).then(() => setNotice(t("saved"))).catch(setError); }} /></li>)}</ul>{error ? <p role="alert" className="text-body-sm text-danger">{problem(error)}</p> : notice ? <p role="status" className="text-body-sm text-success">{notice}</p> : null}</section>;
}
