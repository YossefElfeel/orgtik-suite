"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button, ConfirmDialog, useSuite, SUITE_TOOLS } from "@orgtik/ui";
import type { ToolKey } from "@orgtik/ui/auth";
import { useAccountAction } from "./useAccount";
import { useAccountProblem } from "./AccountState";
import { useBillingLineActionMutation, type SubscriptionLine } from "@/redux/features/platform/billing";
export function SubscriptionRetention({ line, mandatory = false }: { line: SubscriptionLine; mandatory?: boolean }) {
  const t = useTranslations("AccountV3"), suite = useSuite(), action = useAccountAction(), [billing, billingState] = useBillingLineActionMutation(), [error, setError] = useState<unknown>(), [notice, setNotice] = useState(""), problem = useAccountProblem();
  if (mandatory || !suite.isOwner || !["active", "cancelling"].includes(line.state)) return null;
  const resume = line.state === "cancelling";
  return <div className="flex flex-col gap-2"><p className="text-body-sm text-fg-muted">{t(resume ? "winBackIntro" : "pauseIntro")}</p><ConfirmDialog trigger={<Button size="sm" variant="secondary" loading={billingState.isLoading || action.busy}>{t(resume ? "keepRenewal" : "pauseRenewal")}</Button>} title={t(resume ? "keepRenewal" : "pauseRenewal")} impact={t(resume ? "resumeImpact" : "pauseImpact")} confirmLabel={t(resume ? "keepRenewal" : "pauseRenewal")} onConfirm={async () => { setError(undefined); try { await billing({ id: line.id, action: resume ? "resume" : "cancel", reason: resume ? "retention_resume" : "pause_renewal" }).unwrap(); await action.act("/retention", "POST", { lineId: line.id, event: resume ? "renewal_resumed" : "pause_requested" }); setNotice(t("saved")); } catch (failure) { setError(failure); throw failure; } }} />{error ? <p role="alert" className="text-body-sm text-danger">{problem(error)}</p> : notice ? <p role="status" className="text-body-sm text-success">{notice}</p> : null}</div>;
}
export function CancellationImpact({ line }: { line: SubscriptionLine }) {
  const t = useTranslations("AccountV3"), locale = useLocale() as "en", suite = useSuite(), [busy, setBusy] = useState(false), [error, setError] = useState<unknown>(), problem = useAccountProblem();
  const tool = line.tool as ToolKey, consequences = suite.snapshot?.connectors?.filter(row => row.source === tool || row.target === tool) || [];
  const exportData = async () => { setBusy(true); try { const data = await suite.request(`/tools/${line.tool}/export`), url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })), link = document.createElement("a"); link.href = url; link.download = `orgtik-${line.tool}-before-cancellation.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (failure) { setError(failure); } finally { setBusy(false); } };
  return <section className="flex flex-col gap-3 rounded-field bg-sunken p-3"><h3 className="text-body-sm font-semibold">{t("cancellationImpact")}</h3><p className="text-body-sm text-fg-muted">{t("cancellationIntro")}</p>{consequences.length ? <ul className="list-inside list-disc text-body-sm">{consequences.map(row => <li key={row.id}>{SUITE_TOOLS[row.source].labels[locale]} · {SUITE_TOOLS[row.target].labels[locale]}</li>)}</ul> : null}<Button variant="secondary" size="sm" className="self-start" loading={busy} onClick={() => void exportData()}>{t("exportBeforeCancel")}</Button>{error ? <p role="alert" className="text-body-sm text-danger">{problem(error)}</p> : null}</section>;
}
