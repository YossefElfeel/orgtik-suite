"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import {
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  LocalizedField,
  NumberField,
  PercentField,
  RadioGroup,
  Select,
  toast,
  useFormatter,
  type LocalizedValue,
} from "@orgtik/ui";
import { Link, useRouter } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import type { ApiError, Localized } from "@/store/api";
import { PLAN_TIERS, useCreatePlanMutation, useFeaturesQuery, useToolsQuery, useUpdatePlanMutation, type Feature, type Plan, type PlanInput, type PlanStatus, type PlanTier, type PlanVisibility } from "@/store/catalog";
import { InlineAlert, useFieldError, useLocalized } from "./bits";

type Errors = Record<string, string | undefined>;
const REQUIRED = ["en", "ar"] as const; // D-014
const YEARLY_DEFAULT = 100 * (2 / 12); // G-03: two months free

/** One limit: a number, unlimited (null) or not in this plan (absent). */
type LimitValue = number | null | undefined;

function LimitRow({ feature, value, onChange, error, readOnly }: { feature: Feature; value: LimitValue; onChange: (v: LimitValue) => void; error?: string; readOnly?: boolean }) {
  const t = useTranslations("Catalog.planForm");
  const tf = useTranslations("Catalog.features");
  const unlimited = value === null;
  const id = `limit-${feature.key.replace(/\W/g, "-")}`;
  return (
    <div className="grid items-start gap-2 border-t border-line py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-col">
        <label htmlFor={id} className="text-label text-fg">
          <code dir="ltr" className="font-mono">{feature.key}</code>
        </label>
        <span className="text-caption text-fg-muted">
          {feature.unit ? <span dir="ltr">{feature.unit}</span> : null}
          {feature.unit && feature.enforcement ? " · " : null}
          {feature.enforcement ? tf(`enforcement.${feature.enforcement}`) : null}
        </span>
        {error ? <span className="text-caption text-danger">{error}</span> : null}
      </div>
      <NumberField
        id={id}
        size="sm"
        value={typeof value === "number" ? value : null}
        onValueChange={(v) => onChange(v === null ? undefined : v)}
        min={0}
        step={1}
        disabled={unlimited}
        readOnly={readOnly}
        aria-label={feature.key}
      />
      <Checkbox label={t("unlimited")} checked={unlimited} disabled={readOnly} onCheckedChange={(on) => onChange(on ? null : undefined)} />
    </div>
  );
}

/**
 * A plan (ADM-07): name, tier, pricing unit, seats, guests, trial, yearly discount, visibility,
 * status, one value per limit feature, and the on/off features. Prices are not edited here: they
 * live in the price grid (ADM-12), linked from the price card. Without `plan` it creates one.
 */
export function PlanForm({ plan, defaultTool }: { plan?: Plan; defaultTool?: string }) {
  const t = useTranslations("Catalog.planForm");
  const tp = useTranslations("Catalog.plans");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const fieldError = useFieldError();
  const localized = useLocalized();
  const router = useRouter();
  const tools = useToolsQuery();
  const [create, creating] = useCreatePlanMutation();
  const [update, updating] = useUpdatePlanMutation();
  const editable = can("plans:edit");

  const [id, setId] = useState("");
  const [tool, setTool] = useState(plan?.tool ?? defaultTool ?? "");
  const [name, setName] = useState<LocalizedValue>(plan?.name ?? {});
  const [tier, setTier] = useState<PlanTier>(plan?.tier ?? "starter");
  const [perUser, setPerUser] = useState(plan?.perUser ?? false);
  const [minSeats, setMinSeats] = useState<number | null>(plan?.minSeats ?? 1);
  const [guestLimit, setGuestLimit] = useState<number | null>(plan?.guestLimit ?? 0);
  const [trialDays, setTrialDays] = useState<number | null>(plan?.trialDays ?? 14);
  const [discount, setDiscount] = useState<number | null>(plan?.yearlyDiscountPct ?? YEARLY_DEFAULT);
  const [visibility, setVisibility] = useState<PlanVisibility>(plan?.visibility ?? "public");
  const [status, setStatus] = useState<PlanStatus>(plan?.status ?? "draft");
  const [limits, setLimits] = useState<Record<string, LimitValue>>(plan?.limits ?? {});
  const [flags, setFlags] = useState<Record<string, boolean>>(plan?.flags ?? {});
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState<string | null>(null);

  const features = useFeaturesQuery(tool ? { tool } : undefined, { skip: !tool });
  const limitFeatures = useMemo(() => (features.data ?? []).filter((x) => x.kind === "limit"), [features.data]);
  const flagFeatures = useMemo(() => (features.data ?? []).filter((x) => x.kind === "flag"), [features.data]);

  const check = (): Errors => {
    const e: Errors = {};
    if (!plan) {
      if (!/^[a-z][a-z0-9_]{2,40}$/.test(id)) e.id = fieldError(id ? "invalid" : "required");
      if (!tool) e.tool = fieldError("required");
    }
    for (const l of REQUIRED) if (!name[l]?.trim()) e[`name.${l}`] = fieldError("required");
    if (minSeats === null || !Number.isInteger(minSeats) || minSeats < 1) e.minSeats = fieldError("min");
    if (guestLimit === null || !Number.isInteger(guestLimit) || guestLimit < 0) e.guestLimit = fieldError("min");
    if (trialDays === null || !Number.isInteger(trialDays) || trialDays < 0 || trialDays > 90) e.trialDays = t("trialRange");
    if (discount === null || discount < 0 || discount >= 100) e.yearlyDiscountPct = t("discountRange");
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFailed(null);
    const e = check();
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      setFailed(tc("fixFields"));
      return;
    }
    // Only the limits this plan sets (a number or unlimited); "not in this plan" is left out.
    const known = new Set(limitFeatures.map((x) => x.key));
    const limitsOut = Object.fromEntries(Object.entries(limits).filter(([k, v]) => known.has(k) && v !== undefined)) as Record<string, number | null>;
    const body: PlanInput = { name: name as Localized, tier, perUser, minSeats: minSeats!, guestLimit: guestLimit!, trialDays: trialDays!, yearlyDiscountPct: discount!, visibility, status, limits: limitsOut, flags };
    try {
      if (plan) {
        await update({ id: plan.id, ...body }).unwrap();
        toast.success(tc("saved"));
      } else {
        const made = await create({ id, tool, ...body }).unwrap();
        toast.success(t("created"));
        router.push(`/plans/${made.id}`);
      }
    } catch (err) {
      const x = err as ApiError;
      if (x.status === 422 && x.fieldErrors) {
        const mapped: Errors = {};
        for (const [k, v] of Object.entries(x.fieldErrors)) {
          // The API answers "name" for the whole field: mark the required languages that are empty.
          if (k === "name") for (const l of REQUIRED) mapped[`name.${l}`] = name[l]?.trim() ? undefined : fieldError(v);
          else mapped[k] = fieldError(v);
        }
        setErrors(mapped);
        setFailed(tc("fixFields"));
      } else setFailed(x.status === 403 ? tc("forbidden") : tc("saveFailed"));
    }
  };

  const nameErrors: LocalizedValue | undefined = errors["name.en"] || errors["name.ar"] ? { en: errors["name.en"], ar: errors["name.ar"] } : undefined;
  const toolOptions = (tools.data ?? []).map((x) => ({ value: x.key, label: localized(x.name) }));
  const ro = !editable;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8">
      {failed ? <InlineAlert>{failed}</InlineAlert> : null}

      <section aria-labelledby="plan-general" className="flex max-w-3xl flex-col gap-5">
        <h2 id="plan-general" className="font-display text-title-sm text-fg">{t("general")}</h2>
        {!plan ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("tool")} error={errors.tool} required>
              <Select value={tool || null} onValueChange={(v) => v && setTool(v)} placeholder={t("chooseTool")} options={toolOptions} required />
            </Field>
            <Field label={t("id")} description={t("idHelp")} error={errors.id} required>
              <Input dir="ltr" className="font-mono" value={id} onChange={(e) => setId(e.target.value.trim())} autoComplete="off" spellCheck={false} required />
            </Field>
          </div>
        ) : null}
        {editable ? (
          <LocalizedField label={t("name")} description={t("nameHelp")} value={name} onChange={setName} required={REQUIRED} errors={nameErrors} />
        ) : (
          <Field label={t("name")}>
            <Input dir="auto" value={localized(plan?.name)} readOnly />
          </Field>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("tier")}>
            <Select value={tier} onValueChange={(v) => v && setTier(v)} readOnly={ro} options={PLAN_TIERS.map((x) => ({ value: x, label: tp(`tier.${x}`) }))} />
          </Field>
          <Field label={t("status")} description={t("statusHelp")}>
            <Select<PlanStatus> value={status} onValueChange={(v) => v && setStatus(v)} readOnly={ro} options={(["draft", "active", "archived"] as const).map((x) => ({ value: x, label: tp(`status.${x}`) }))} />
          </Field>
        </div>
        <Field label={t("unit")} group>
          <RadioGroup<"flat" | "per_user">
            orientation="horizontal"
            value={perUser ? "per_user" : "flat"}
            onValueChange={(v) => setPerUser(v === "per_user")}
            disabled={ro}
            options={[
              { value: "flat", label: tp("flat") },
              { value: "per_user", label: tp("perUser") },
            ]}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={t("minSeats")} error={errors.minSeats}>
            <NumberField value={minSeats} onValueChange={setMinSeats} min={1} step={1} readOnly={ro} />
          </Field>
          <Field label={t("guestLimit")} description={t("guestHelp")} error={errors.guestLimit}>
            <NumberField value={guestLimit} onValueChange={setGuestLimit} min={0} step={1} readOnly={ro} />
          </Field>
          <Field label={t("trialDays")} description={t("trialHelp")} error={errors.trialDays}>
            <NumberField value={trialDays} onValueChange={setTrialDays} min={0} max={90} step={1} readOnly={ro} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("yearlyDiscount")} description={t("yearlyHelp")} error={errors.yearlyDiscountPct}>
            <PercentField value={discount} onValueChange={setDiscount} decimals={2} max={99.99} readOnly={ro} />
          </Field>
          <Field label={t("visibility")} group>
            <RadioGroup<PlanVisibility>
              orientation="horizontal"
              value={visibility}
              onValueChange={setVisibility}
              disabled={ro}
              options={[
                { value: "public", label: tp("visibility.public") },
                { value: "private", label: tp("visibility.private") },
              ]}
            />
          </Field>
        </div>
      </section>

      <section aria-labelledby="plan-price" className="max-w-3xl">
        <h2 id="plan-price" className="sr-only">{t("price")}</h2>
        <Card padding="md" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-label text-fg">{t("price")}</span>
            <span className="text-body-sm text-fg-muted">
              {plan?.defaultUsd ? t("priceIs", { price: f.money(plan.defaultUsd.monthly, "USD") }) : t("priceNone")}
            </span>
          </div>
          {can("pricing:view") && tool ? (
            <Link href={`/pricing?tool=${tool}`} className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {t("priceGrid")}
              <ArrowSquareOut aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            </Link>
          ) : null}
        </Card>
      </section>

      <section aria-labelledby="plan-limits" aria-busy={features.isLoading || undefined} className="flex max-w-3xl flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="plan-limits" className="font-display text-title-sm text-fg">{t("limits")}</h2>
          <p className="text-body-sm text-fg-muted">{t("limitsHelp")}</p>
        </div>
        {!tool ? (
          <p className="text-body-sm text-fg-muted">{t("chooseToolFirst")}</p>
        ) : features.isError ? (
          <InlineAlert action={<Button size="sm" variant="secondary" onClick={() => features.refetch()}>{tc("retry")}</Button>}>{tc("loadFailed")}</InlineAlert>
        ) : limitFeatures.length ? (
          <div className="rounded-card border border-line px-4">
            {limitFeatures.map((x) => (
              <LimitRow key={x.key} feature={x} value={limits[x.key]} onChange={(v) => setLimits((m) => ({ ...m, [x.key]: v }))} error={errors[`limits.${x.key}`]} readOnly={ro} />
            ))}
          </div>
        ) : features.isLoading ? null : (
          <p className="text-body-sm text-fg-muted">{t("noLimits")}</p>
        )}
      </section>

      {flagFeatures.length ? (
        <section aria-labelledby="plan-flags" className="flex max-w-3xl flex-col gap-3">
          <h2 id="plan-flags" className="font-display text-title-sm text-fg">{t("flags")}</h2>
          <div className="flex flex-col gap-3 rounded-card border border-line p-4">
            {flagFeatures.map((x) => (
              <Checkbox
                key={x.key}
                label={<code dir="ltr" className="font-mono">{x.key}</code>}
                checked={Boolean(flags[x.key])}
                disabled={ro}
                onCheckedChange={(on) => setFlags((m) => ({ ...m, [x.key]: Boolean(on) }))}
              />
            ))}
          </div>
        </section>
      ) : null}

      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={creating.isLoading || updating.isLoading}>
            {plan ? tc("save") : t("create")}
          </Button>
          {!plan ? (
            <Button type="button" variant="secondary" onClick={() => router.push(tool ? `/plans?tool=${tool}` : "/plans")}>
              {tc("cancel")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
