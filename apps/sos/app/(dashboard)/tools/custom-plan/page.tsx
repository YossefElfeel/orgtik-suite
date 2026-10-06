"use client";

// A custom plan (USR-25): the owner asks OrgTik for a plan the price list doesn't cover (which
// tools, how many people, monthly or yearly, anything else), sees their requests and the quotes
// sent back, and accepts a quote. OrgTik's team answers in the back office (ADM-22). Owner only.
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Card, Checkbox, ConfirmDialog, Field, ListStates, NumberField, PageHeader, RadioGroup, Textarea, toast, useFormatter, type Tone } from "@orgtik/ui";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";
import {
  platformError,
  useAcceptCustomPlanMutation,
  useCustomPlansQuery,
  useRequestCustomPlanMutation,
  useToolCatalogQuery,
  type CustomPlanRequest,
  type Cycle,
} from "@/redux/features/platform/tools";
import { Notice, useLocalized, useToolsError } from "@/components/workspace/tools/shared";

const TONE: Record<string, Tone> = { new: "info", quoted: "warning", accepted: "success", declined: "neutral", expired: "neutral" };

function RequestForm() {
  const t = useTranslations("Tools.custom");
  const tp = useTranslations("Tools.plans");
  const loc = useLocalized();
  const errorText = useToolsError();
  const { data: catalog } = useToolCatalogQuery();
  const [send, { isLoading }] = useRequestCustomPlanMutation();
  const [tools, setTools] = useState<string[]>([]);
  const [seats, setSeats] = useState<number | null>(null);
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ tools?: string; seats?: string; form?: string }>({});
  const choices = (catalog ?? []).filter((c) => c.status !== "coming_soon" && !c.mandatory);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!tools.length) next.tools = t("toolsRequired");
    if (!seats || seats < 1) next.seats = t("seatsRequired");
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await send({ tools, seats: seats!, cycle, notes: notes.trim() }).unwrap();
      toast.success(t("sent"));
      setTools([]);
      setSeats(null);
      setNotes("");
    } catch (err) {
      const pe = platformError(err);
      setErrors({ tools: pe?.fieldErrors?.tools ? t("toolsRequired") : undefined, seats: pe?.fieldErrors?.seats ? t("seatsRequired") : undefined, form: pe?.fieldErrors ? undefined : errorText(pe) });
    }
  };

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title-sm text-fg">{t("formTitle")}</h2>
        <p className="text-body-sm text-fg-muted">{t("formBody")}</p>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label={t("tools")} group required error={errors.tools}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(11rem,100%),1fr))] gap-2">
            {choices.map((c) => (
              <Checkbox key={c.key} label={loc(c.name)} checked={tools.includes(c.key)} onCheckedChange={(on) => setTools((x) => (on ? [...x, c.key] : x.filter((k) => k !== c.key)))} />
            ))}
          </div>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("seats")} description={t("seatsHelp")} required error={errors.seats}>
            <NumberField min={1} max={100000} value={seats} onValueChange={setSeats} />
          </Field>
          <Field label={tp("cycle")} group>
            <RadioGroup<Cycle>
              orientation="horizontal"
              value={cycle}
              onValueChange={setCycle}
              options={[
                { value: "monthly", label: tp("monthly") },
                { value: "yearly", label: tp("yearly") },
              ]}
            />
          </Field>
        </div>
        <Field label={t("notes")} description={t("notesHelp")} optional>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxRows={10} />
        </Field>
        {errors.form ? <Notice tone="danger">{errors.form}</Notice> : null}
        <div>
          <Button type="submit" loading={isLoading}>
            {t("send")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RequestItem({ r }: { r: CustomPlanRequest }) {
  const t = useTranslations("Tools.custom");
  const tp = useTranslations("Tools.plans");
  const f = useFormatter();
  const loc = useLocalized();
  const errorText = useToolsError();
  const { data: catalog } = useToolCatalogQuery();
  const [accept] = useAcceptCustomPlanMutation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const names = r.tools.map((k) => loc(catalog?.find((c) => c.key === k)?.name) || k);
  const expired = r.quote ? Date.parse(r.quote.validUntil) < Date.now() : false;
  const state = r.state === "quoted" && expired ? "expired" : r.state;
  const stateLabel = t.has(`state.${state}`) ? t(`state.${state}`) : state;
  return (
    <li>
      <Card padding="md" className="flex flex-col gap-3" data-request={r.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-display text-title-sm text-fg">{names.join(" · ")}</h3>
            <p className="text-body-sm text-fg-muted">
              {t("summary", { seats: r.seats, cycle: tp(r.cycle), date: f.date(r.createdAt, { dateStyle: "medium" }) })}
            </p>
          </div>
          <Badge tone={TONE[state] ?? "neutral"}>{stateLabel}</Badge>
        </div>
        {r.notes ? (
          <p className="text-body-sm text-fg" dir="auto">
            {r.notes}
          </p>
        ) : null}
        {r.quote ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-sunken px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-body-sm text-fg-muted">{t("quote")}</p>
              <p className="font-display text-title-sm text-fg">
                <span dir="ltr">{f.money(r.quote.amount, r.quote.currency)}</span> <span className="text-body-sm font-normal text-fg-muted">{tp(`per.${r.cycle === "yearly" ? "year" : "month"}`)}</span>
              </p>
              <p className="text-body-sm text-fg-muted">{t(expired ? "expiredOn" : "validUntil", { date: f.date(r.quote.validUntil, { dateStyle: "medium" }) })}</p>
            </div>
            {r.state === "quoted" && !expired ? (
              <Button onClick={() => setOpen(true)}>{t("accept")}</Button>
            ) : null}
          </div>
        ) : r.state === "new" ? (
          <p className="text-body-sm text-fg-muted">{t("waiting")}</p>
        ) : null}
        {r.state === "accepted" ? <Notice tone="success">{t("acceptedBody")}</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </Card>
      {r.quote ? (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          tone="primary"
          title={t("acceptTitle")}
          impact={t("acceptImpact", { amount: f.money(r.quote.amount, r.quote.currency), seats: r.seats, cycle: tp(r.cycle) })}
          confirmLabel={t("accept")}
          cancelLabel={tp("cancel")}
          onConfirm={async () => {
            setError(null);
            try {
              await accept(r.id).unwrap();
              toast.success(t("accepted"));
            } catch (err) {
              const pe = platformError(err);
              setError(pe?.code === "expired" ? t("quoteExpired") : errorText(pe));
            }
          }}
        />
      ) : null}
    </li>
  );
}

function CustomPlans() {
  const t = useTranslations("Tools.custom");
  const tc = useTranslations("Tools.catalog");
  const { data, isLoading, error, refetch } = useCustomPlansQuery();
  const status = isLoading ? "loading" : error ? "error" : !data?.length ? "empty" : "ready";
  const list = [...(data ?? [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader breadcrumb={[{ label: tc("title"), href: "/tools" }, { label: t("title") }]} title={t("title")} description={t("description")} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <RequestForm />
        <section aria-labelledby="requests" className="flex flex-col gap-3">
          <h2 id="requests" className="font-display text-title-sm text-fg">
            {t("yourRequests")}
          </h2>
          <ListStates status={status} onRetry={refetch} size="compact" empty={{ title: t("emptyTitle"), description: t("emptyBody") }} error={{ title: t("failed") }}>
            <ul className="flex flex-col gap-3">
              {list.map((r) => (
                <RequestItem key={r.id} r={r} />
              ))}
            </ul>
          </ListStates>
        </section>
      </div>
    </div>
  );
}

export default function CustomPlanPage() {
  return (
    <RequireWorkspaceRole role="owner">
      <CustomPlans />
    </RequireWorkspaceRole>
  );
}
