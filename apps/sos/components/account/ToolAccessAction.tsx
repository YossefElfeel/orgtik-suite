"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, toolFromScope, useSuite } from "@orgtik/ui";
import { useAccountProblem } from "./AccountState";
export function ToolAccessAction({ toolKey, trial }: { toolKey: string; trial?: boolean }) {
  const suite = useSuite(), t = useTranslations("AccountV3"), problem = useAccountProblem(), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState<unknown>(), tool = toolFromScope(toolKey);
  if (!tool || suite.toolState(tool)?.reason === "unsupported_tool_role") return <p className="text-body-sm text-fg-muted">{t("roleDenied")}</p>;
  const run = async () => { setBusy(true); setError(undefined); try { if (trial && suite.isOwner) { const plans = await suite.request<{ id: string; trialDays: number }[]>(`/tools/${tool}/plans`), selected = plans.find(plan => plan.trialDays > 0); if (!selected) throw Error("trial_unavailable"); await suite.mutate(`/tools/${tool}/trial`, "POST", { planId: selected.id }); window.location.reload(); } else { await suite.mutate("/access-requests", "POST", { tool }); setSaved(true); } } catch (failure) { setError(failure); } finally { setBusy(false); } };
  return <div className="flex flex-col gap-2">{saved ? <p role="status" className="text-body-sm text-success">{t("requestSaved")}</p> : <Button size="sm" loading={busy} disabled={Boolean(suite.snapshot?.actor.readOnly || ["suspended", "cancelled", "deleted"].includes(suite.snapshot?.workspace.state || ""))} onClick={() => void run()}>{t(trial && suite.isOwner ? "startTrial" : "requestAccess")}</Button>}{error ? <p role="alert" className="text-body-sm text-danger">{problem(error)}</p> : null}</div>;
}
