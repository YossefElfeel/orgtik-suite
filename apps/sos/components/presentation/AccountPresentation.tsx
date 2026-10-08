"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, DownloadSimple } from "@phosphor-icons/react";
import { AuditLogTable, Button, Checkbox, Field, Input, PageHeader, PdfPreview, Select, SimulatedTag, TwoFactorScreens, UsageMeter, useDemoScene, type AuditEntry } from "@orgtik/ui";
import { useForm } from "react-hook-form";
import { RHFField } from "@orgtik/ui/rhf";

const steps = ["profile", "team", "tools", "billing", "firstTask"] as const;
const views = ["overview", "activity", "verification", "documents"] as const;
export function AccountPresentation() {
  const t = useTranslations("AccountPresentation"), demo = useDemoScene();
  const workspace = demo.scene.workspace === "current" ? "nile" : demo.scene.workspace;
  const [view, setView] = useState<(typeof views)[number]>("overview"), [complete, setComplete] = useState<string[]>([]), [enabledByPersona, setEnabledByPersona] = useState<Record<string, boolean>>({}), [revision, setRevision] = useState(0), [notice, setNotice] = useState("");
  const [events, setEvents] = useState<AuditEntry[]>([]);
  const [contacts, setContacts] = useState<string[]>(["finance@nilefoods.test"]);
  const billingForm = useForm<{ email: string }>({ defaultValues: { email: "" } });
  const persona = ({ mona: "Mona Adel", nour: "Nour Khaled", rana: "Rana Saad", omar: "Omar Farouk", salma: "Salma Nabil", hoda: "Hoda Ashraf", hany: "Hany Samir" } as Record<string, string>)[demo.scene.persona] ?? "Nour Khaled";
  const enabled = enabledByPersona[persona] ?? false;
  const isNew = workspace === "new", overdue = workspace === "spree";
  const usage = { seats: isNew ? 0 : 3, capacity: 5, filesGb: isNew ? 0 : overdue ? 10 : 8.4, filesLimitGb: 10, automations: isNew ? 0 : 84, automationLimit: 100 };
  const reset = () => {
    setComplete(workspace === "new" ? [] : ["profile", "tools"]); setEnabledByPersona({}); setRevision(before => before + 1); setNotice(""); setContacts(workspace === "new" ? [] : ["finance@nilefoods.test"]); billingForm.reset();
    setEvents(workspace === "new" ? [] : [{ id: "seed-1", actor: "Nour Khaled", action: t("workspaceCreated"), target: workspace, at: "2026-10-07T09:00:00Z", simulated: true }, { id: "seed-2", actor: "Mona Adel → Nour Khaled", action: t("viewAs"), target: workspace, at: "2026-10-07T09:10:00Z", simulated: true }]);
  };
  useEffect(() => { reset(); }, [workspace]); // locale changes keep scene edits; audit labels are a historical snapshot.
  const record = (action: string, target: string) => setEvents(before => [{ id: crypto.randomUUID(), actor: persona, action, target, at: "2026-10-08T09:00:00Z", simulated: true }, ...before]);
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ prototype: true, simulated: true, workspace, persona, usage, onboarding: complete, activity: events, verificationSceneEnabled: enabled }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = "orgtik-demo-workspace.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); record(t("dataExported"), workspace); setNotice(t("exported"));
  };
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title={t("heading")} description={t("intro")} actions={<><Button variant="secondary" startIcon={<ArrowCounterClockwise />} onClick={reset}>{t("reset")}</Button><Button variant="secondary" startIcon={<DownloadSimple />} onClick={exportData}>{t("export")}</Button></>} />
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="inline-flex max-w-prose items-center gap-2 text-body-sm text-fg-muted"><SimulatedTag />{t("localOnly")}</p><Field label={t("show")}><Select value={view} onValueChange={value => value && setView(value as typeof view)} options={views.map(value => ({ value, label: t(value) }))} /></Field></div>
    {notice ? <p role="status" className="text-body text-fg-brand">{notice}</p> : null}
    {view === "overview" ? <div className="grid items-start gap-5 lg:grid-cols-2">
      <section className="rounded-panel border border-line bg-raised p-5" aria-labelledby="account-usage"><h2 id="account-usage" className="font-display text-title-sm">{t("usage")}</h2><p className="mt-1 text-body-sm text-fg-muted">{t("usageNote")}</p><div className="mt-3 divide-y divide-line"><UsageMeter label={t("seats")} used={usage.seats} limit={usage.capacity} /><UsageMeter label={t("storage")} used={usage.filesGb} limit={usage.filesLimitGb} unit="GB" /><UsageMeter label={t("automation")} used={usage.automations} limit={usage.automationLimit} /></div></section>
      <section className="rounded-panel border border-line bg-raised p-5" aria-labelledby="account-onboarding"><h2 id="account-onboarding" className="font-display text-title-sm">{t("onboarding")}</h2><p className="mt-1 text-body-sm text-fg-muted">{t("onboardingNote")}</p><div className="mt-4"><UsageMeter label={t("progress")} used={complete.length} limit={steps.length} warnings={false} valueText={t("stepCount", { count: complete.length, total: steps.length })} /></div><ul className="mt-3 flex flex-col gap-4">{steps.map(step => <li key={step}><Checkbox label={t(step)} checked={complete.includes(step)} onCheckedChange={checked => { setComplete(before => checked ? [...before, step] : before.filter(value => value !== step)); record(t(checked ? "stepCompleted" : "stepReopened"), t(step)); }} /></li>)}</ul></section>
    </div> : null}
    {view === "activity" ? <section className="rounded-panel border border-line bg-raised p-5"><h2 className="mb-4 font-display text-title-sm">{t("activity")}</h2><AuditLogTable entries={events} /></section> : null}
    {view === "verification" ? <TwoFactorScreens key={`${workspace}-${revision}-${persona}`} enabled={enabled} onChange={value => { setEnabledByPersona(before => ({ ...before, [persona]: value })); record(t(value ? "demoEnabled" : "demoDisabled"), t("verification")); }} /> : null}
    {view === "documents" ? <><PdfPreview samplePdfHref="/presentation/sample-invoice.pdf"><h2 className="mb-3 font-display text-title-sm">{t("sampleInvoice")}</h2><img src="/presentation/sample-invoice.png" alt={t("sampleInvoice")} className="mx-auto h-auto max-w-full rounded-field border border-line" /></PdfPreview><section className="flex flex-col gap-4 rounded-panel border border-line bg-raised p-5"><h2 className="font-display text-title-sm">{t("billingContacts")}</h2><p className="text-body-sm text-fg-muted">{t("billingContactNote")}</p><RHFField control={billingForm.control} name="email" label={t("billingEmail")} rules={{ validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || t("emailError") }} render={field => <Input type="email" {...field} />} /><Button className="self-start" onClick={async () => { if (!(await billingForm.trigger("email"))) return; const email = billingForm.getValues("email").trim(); setContacts(before => before.includes(email) ? before : [...before, email]); billingForm.reset(); record(t("billingContactAdded"), email); }}>{t("addBillingContact")}</Button><ul className="text-body-sm">{contacts.map(email => <li key={email} className="py-1"><bdi>{email}</bdi></li>)}</ul></section></> : null}
    <p className="max-w-prose text-caption text-fg-muted">{t("handoffNote")}</p>
  </div>;
}
