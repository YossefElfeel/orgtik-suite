"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Question } from "@phosphor-icons/react";
import { Badge, Button, Card, Checkbox, ErrorState, Field, Input, LoadingState, NumberField, PageHeader, RadioGroup, toast } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { asApiError } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { usePlatformSettingsQuery, useUpdateSettingsMutation, type Settings } from "@/store/system";

const GAPS = ["seatModel", "taxDisplay", "addOns", "generalPaid", "hostingOps", "mailboxes"];
type Form = Omit<Settings, "switches" | "company"> & { switches: Record<string, unknown> };
const toList = (s: string) => s.split(/[,،\s]+/).filter(Boolean).map(Number);
const okList = (s: string, min: number, max: number) => toList(s).length > 0 && toList(s).every((n) => Number.isInteger(n) && n >= min && n <= max);

function Group({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="font-display text-title-sm text-fg">
          {title}
        </h2>
        {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}

function SettingsForm({ settings }: { settings: Settings }) {
  const t = useTranslations("System");
  const tc = useTranslations("Common");
  const can = useCan();
  const editable = can("settings:full");
  const ro = !editable;
  const init = (): Form => ({ retention: settings.retention, dunning: settings.dunning, trial: settings.trial, services: settings.services, limits: settings.limits, priceChange: settings.priceChange, switches: Object.fromEntries(Object.entries(settings.switches).map(([k, s]) => [k, s.value])) });
  const [form, setForm] = useState<Form>(init);
  const [reminders, setReminders] = useState(settings.trial.remindDaysBefore.join(", "));
  const [warnAt, setWarnAt] = useState(settings.limits.warnAtPct.join(", "));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, saving] = useUpdateSettingsMutation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setForm(init()), [settings]);

  const num = <K extends "retention" | "dunning" | "services" | "priceChange">(group: K, key: keyof Form[K]) => ({
    value: form[group][key] as unknown as number,
    onValueChange: (v: number | null) => setForm({ ...form, [group]: { ...form[group], [key]: v ?? 0 } }),
    disabled: ro,
    step: 1,
  });

  const check = () => {
    const e: Record<string, string> = {};
    if (Object.values(form.retention).some((d) => !(d >= 0 && d <= 365))) e.retention = "range";
    if (!(form.dunning.graceDays >= 1 && form.dunning.cancelAfterDays > form.dunning.graceDays)) e.dunning = "order";
    if (!okList(reminders, 1, 60)) e.trial = "list";
    if (!okList(warnAt, 1, 100)) e.limits = "list";
    if (!(form.services.autoApproveDays >= 1)) e.services = "min";
    if (!(form.priceChange.noticeDays >= 0)) e.priceChange = "min";
    return e;
  };
  const submit = () => {
    const e = check();
    setErrors(e);
    if (Object.keys(e).length) return;
    const changedSwitches = Object.fromEntries(Object.entries(form.switches).filter(([k, v]) => settings.switches[k]?.value !== v));
    save({
      retention: form.retention,
      dunning: form.dunning,
      trial: { ...form.trial, remindDaysBefore: toList(reminders).sort((a, b) => b - a) },
      services: form.services,
      limits: { warnAtPct: toList(warnAt).sort((a, b) => a - b) },
      priceChange: form.priceChange,
      ...(Object.keys(changedSwitches).length ? { switches: changedSwitches } : {}),
    })
      .unwrap()
      .then(() => toast.success(t("settings.saved")))
      .catch((x) => {
        const a = asApiError(x);
        if (a.status === 422 && a.fieldErrors) setErrors(a.fieldErrors);
        else toast.error(a.status === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };
  const err = (k: string) => (errors[k] ? t(`settings.errors.${k}`) : undefined);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {ro ? <p className="rounded-card border border-line bg-sunken p-3 text-body-sm text-fg-muted">{t("settings.viewOnly")}</p> : null}
      {Object.keys(errors).length ? (
        <p role="alert" className="text-body-sm text-danger">
          {tc("fixFields")}
        </p>
      ) : null}

      <Group id="st-retention" title={t("settings.retention")} description={t("settings.retentionHelp")}>
        {errors.retention ? <p className="text-body-sm text-danger">{err("retention")}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(["toolDays", "workspaceDays", "trashDays", "backupDays"] as const).map((k) => (
            <Field key={k} label={t(`settings.${k}`)} description={t("settings.daysUnit")}>
              <NumberField {...num("retention", k)} min={0} max={365} />
            </Field>
          ))}
        </div>
      </Group>

      <Group id="st-dunning" title={t("settings.dunning")} description={t("settings.dunningHelp")}>
        {errors.dunning ? <p className="text-body-sm text-danger">{err("dunning")}</p> : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("settings.graceDays")} description={t("settings.graceDaysHelp")}>
            <NumberField {...num("dunning", "graceDays")} min={1} max={60} />
          </Field>
          <Field label={t("settings.readOnlyAfterDays")} description={t("settings.readOnlyAfterDaysHelp")}>
            <NumberField {...num("dunning", "readOnlyAfterDays")} min={0} max={90} />
          </Field>
          <Field label={t("settings.cancelAfterDays")} description={t("settings.cancelAfterDaysHelp")} error={errors.dunning ? t("settings.errors.cancelAfter") : undefined}>
            <NumberField {...num("dunning", "cancelAfterDays")} min={2} max={365} />
          </Field>
        </div>
      </Group>

      <Group id="st-customers" title={t("settings.customers")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.trialReminders")} description={t("settings.trialRemindersHelp")} error={err("trial")}>
            <Input dir="ltr" value={reminders} onChange={(e) => setReminders(e.target.value)} disabled={ro} inputMode="numeric" />
          </Field>
          <Field label={t("settings.limitWarnings")} description={t("settings.limitWarningsHelp")} error={err("limits")}>
            <Input dir="ltr" value={warnAt} onChange={(e) => setWarnAt(e.target.value)} disabled={ro} inputMode="numeric" />
          </Field>
          <Field label={t("settings.autoApproveDays")} description={t("settings.autoApproveDaysHelp")} error={err("services")}>
            <NumberField {...num("services", "autoApproveDays")} min={1} max={60} />
          </Field>
          <Field label={t("settings.noticeDays")} description={t("settings.noticeDaysHelp")} error={err("priceChange")}>
            <NumberField {...num("priceChange", "noticeDays")} min={0} max={180} />
          </Field>
        </div>
        <Checkbox checked={form.trial.onePerToolPerWorkspace} onCheckedChange={(v) => setForm({ ...form, trial: { ...form.trial, onePerToolPerWorkspace: Boolean(v) } })} disabled={ro} label={t("settings.onePerTool")} description={t("settings.onePerToolHelp")} />
      </Group>

      <section aria-labelledby="st-gaps" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="st-gaps" className="font-display text-title-sm text-fg">
            {t("settings.gapsTitle")}
          </h2>
          <p className="text-body-sm text-fg-muted">{t("settings.gapsHelp")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(settings.switches).map(([key, sw]) => {
            const known = GAPS.includes(key);
            const value = form.switches[key];
            const options = sw.options.map((o, i) => ({ value: String(i), label: known ? t(`settings.gaps.${key}.options.${i}`) : String(o) }));
            const selected = sw.options.findIndex((o) => o === value);
            return (
              <Card key={key} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Question aria-hidden="true" className="size-5 text-warning" />
                  <h3 className="text-label text-fg">{known ? t(`settings.gaps.${key}.title`) : key}</h3>
                  <Badge size="sm" tone="warning">
                    {tc("gap", { gap: sw.gap })}
                  </Badge>
                  <Badge size="sm" tone={sw.decided ? "success" : "neutral"}>
                    {sw.decided ? t("settings.decided") : tc("notDecided")}
                  </Badge>
                </div>
                <p className="text-body-sm text-fg-muted">{known ? t(`settings.gaps.${key}.note`) : sw.note}</p>
                {options.length > 1 ? (
                  <Field label={t("settings.workingValue")} description={sw.decided ? undefined : t("settings.workingValueHelp")} group>
                    <RadioGroup value={selected >= 0 ? String(selected) : undefined} onValueChange={(v) => setForm({ ...form, switches: { ...form.switches, [key]: sw.options[Number(v)] } })} options={options} disabled={ro} />
                  </Field>
                ) : (
                  <p className="text-body-sm text-fg">
                    <span className="text-fg-muted">{t("settings.workingValue")}: </span>
                    {value === null || value === undefined ? t("settings.noValue") : (options[0]?.label ?? String(value))}
                  </p>
                )}
                {selected < 0 && options.length > 1 ? <p className="text-body-sm text-fg">{t("settings.noValue")}</p> : null}
              </Card>
            );
          })}
        </div>
      </section>

      {editable ? (
        <div className="flex justify-end">
          <Button type="submit" loading={saving.isLoading}>
            {t("settings.save")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function SettingsPage() {
  const t = useTranslations("System");
  const tc = useTranslations("Common");
  const { data, isLoading, error, refetch } = usePlatformSettingsQuery();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      {isLoading ? <LoadingState rows={8} label={tc("loading")} /> : error || !data ? <ErrorState title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} /> : <SettingsForm settings={data} />}
    </div>
  );
}

export default function Page() {
  return (
    <RequirePermission permission="settings:view">
      <SettingsPage />
    </RequirePermission>
  );
}
