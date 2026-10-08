"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Plus, Question } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  IconButton,
  Input,
  PercentField,
  Select,
  Textarea,
  toast,
  useFormatter,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { asApiError, listStatus, useCountryName } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { useCommerceCountriesQuery, useSaveTaxRuleMutation, useTaxRulesQuery, type GapSwitch, type TaxRule } from "@/store/commerce";

/** G-12 is open: whether prices show with tax included. Said plainly, never defaulted silently. */
export function TaxDisplayQuestion({ decision }: { decision?: GapSwitch }) {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const decided = decision?.decided;
  return (
    <section aria-labelledby="g12-title" className="flex flex-col gap-2 rounded-card border border-line bg-warning-subtle p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Question aria-hidden="true" className="size-5 text-warning" />
        <h2 id="g12-title" className="text-label text-fg">
          {t("tax.g12Title")}
        </h2>
        <Badge size="sm" tone="warning">
          {tc("gap", { gap: decision?.gap ?? "G-12" })}
        </Badge>
        <Badge size="sm" tone={decided ? "success" : "neutral"}>
          {decided ? t(`tax.display.${String(decision?.value)}`) : tc("notDecided")}
        </Badge>
      </div>
      <p className="text-body-sm text-fg">{t("tax.g12Body")}</p>
      <p className="text-body-sm text-fg-muted">{t("tax.g12Where")}</p>
    </section>
  );
}

const blank = (country = ""): TaxRule => ({ country, name: "VAT", rate: 0, inclusive: null, b2bReverseCharge: false, eInvoicing: "", active: true });

function TaxRuleDialog({ rule, taken, onClose }: { rule: TaxRule | null; taken: string[]; onClose: () => void }) {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const country = useCountryName();
  const countries = useCommerceCountriesQuery();
  const [d, setD] = useState<TaxRule>(rule ?? blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, saving] = useSaveTaxRuleMutation();
  const submit = () => {
    const e: Record<string, string> = {};
    if (!d.country) e.country = "required";
    if (!d.name.trim()) e.name = "required";
    if (!(d.rate >= 0 && d.rate < 100)) e.rate = "range";
    setErrors(e);
    if (Object.keys(e).length) return;
    save({ ...d, name: d.name.trim() })
      .unwrap()
      .then(() => {
        toast.success(t("tax.saved", { country: country(d.country) }));
        onClose();
      })
      .catch((x) => {
        const a = asApiError(x);
        if (a.status === 422 && a.fieldErrors) setErrors(a.fieldErrors);
        else toast.error(a.status === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };
  const options = (countries.data ?? []).filter((c) => !taken.includes(c.iso) || c.iso === rule?.country).map((c) => ({ value: c.iso, label: country(c.iso) }));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{rule ? t("tax.editTitle", { country: country(rule.country) }) : t("tax.addTitle")}</DialogTitle>
          <DialogDescription>{t("tax.dialogHelp")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {!rule ? (
            <Field label={t("tax.country")} error={errors.country ? tc("required") : undefined} required>
              <Select value={d.country || null} onValueChange={(v) => setD({ ...d, country: v ?? "" })} options={options} placeholder={t("tax.chooseCountry")} />
            </Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("tax.name")} description={t("tax.nameHelp")} error={errors.name ? tc("required") : undefined} required>
              <Input dir="auto" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            </Field>
            <Field label={t("tax.rate")} error={errors.rate ? t("tax.rateRange") : undefined} required>
              <PercentField value={d.rate} onValueChange={(v) => setD({ ...d, rate: v ?? 0 })} min={0} max={99.99} decimals={2} />
            </Field>
          </div>
          <Checkbox checked={d.b2bReverseCharge} onCheckedChange={(v) => setD({ ...d, b2bReverseCharge: Boolean(v) })} label={t("tax.reverseCharge")} description={t("tax.reverseChargeHelp")} />
          <Field label={t("tax.eInvoicing")} description={t("tax.eInvoicingHelp")} optional>
            <Textarea dir="auto" value={d.eInvoicing} onChange={(e) => setD({ ...d, eInvoicing: e.target.value })} maxRows={4} />
          </Field>
          <Checkbox checked={d.active} onCheckedChange={(v) => setD({ ...d, active: Boolean(v) })} label={t("tax.activeLabel")} description={t("tax.activeHelp")} />
          <div className="flex flex-col gap-1 rounded-card border border-line bg-sunken p-3">
            <span className="text-label text-fg">{t("tax.priceDisplay")}</span>
            <span className="text-body-sm text-fg-muted">{d.inclusive === null ? t("tax.priceDisplayOpen") : t(`tax.display.${d.inclusive ? "inclusive" : "exclusive"}`)}</span>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={saving.isLoading} onClick={submit}>
            {rule ? tc("save") : t("tax.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TaxRules() {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const country = useCountryName();
  const can = useCan();
  const editable = can("tax:edit");
  const { data, isLoading, error, refetch } = useTaxRulesQuery();
  const [editing, setEditing] = useState<TaxRule | "new" | null>(null);
  const rules = data?.items ?? [];

  const columns = useMemo<ColumnDef<TaxRule, unknown>[]>(
    () => [
      {
        id: "country",
        header: t("tax.country"),
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span className="font-medium text-fg">{country(row.original.country)}</span>
            <span dir="auto" className="text-caption text-fg-subtle">
              {row.original.name}
            </span>
          </span>
        ),
      },
      { id: "rate", header: t("tax.rate"), meta: { numeric: true }, cell: ({ row }) => f.percent(row.original.rate / 100, 2) },
      {
        id: "display",
        header: t("tax.priceDisplay"),
        cell: ({ row }) =>
          row.original.inclusive === null ? (
            <Badge size="sm" tone="warning" icon={<Question />}>
              {t("tax.openShort")}
            </Badge>
          ) : (
            t(`tax.display.${row.original.inclusive ? "inclusive" : "exclusive"}`)
          ),
      },
      { id: "b2b", header: t("tax.reverseChargeShort"), cell: ({ row }) => (row.original.b2bReverseCharge ? tc("yes") : tc("no")) },
      {
        id: "einv",
        header: t("tax.eInvoicing"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span dir="auto" className="block max-w-80 text-body-sm text-fg-muted">
            {row.original.eInvoicing || "—"}
          </span>
        ),
      },
      {
        id: "active",
        header: t("tax.state"),
        cell: ({ row }) => (
          <Badge size="sm" tone={row.original.active ? "success" : "neutral"}>
            {row.original.active ? t("tax.applied") : t("tax.notApplied")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) => (editable ? <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("tax.editFor", { country: country(row.original.country) })} onClick={() => setEditing(row.original)} /> : null),
      },
    ],
    [t, tc, f, country, editable],
  );

  return (
    <div className="flex flex-col gap-4">
      <TaxDisplayQuestion decision={data?.meta?.decision} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm text-fg-muted">{editable ? t("tax.rulesHelp") : tc("viewOnly")}</p>
        {editable ? (
          <Button startIcon={<Plus />} onClick={() => setEditing("new")}>
            {t("tax.add")}
          </Button>
        ) : null}
      </div>
      <DataTable label={t("tax.rulesTitle")} columns={columns} data={rules} getRowId={(r) => r.country} status={listStatus(isLoading, error)} paginate onRetry={refetch} empty={{ title: t("tax.empty") }} />
      {editing ? <TaxRuleDialog rule={editing === "new" ? null : editing} taken={rules.map((r) => r.country)} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
