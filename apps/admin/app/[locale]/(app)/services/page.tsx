"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  IconButton,
  LocalizedField,
  NumberField,
  PageHeader,
  PercentField,
  Select,
  toast,
  useFormatter,
  type LocalizedValue,
  type Tone,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { asApiError, listStatus, usePick } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { useServicesQuery, useServiceZonesQuery, useUpdateServiceMutation, type Service } from "@/store/services";

const STATUSES = ["draft", "active", "archived"] as const;
const STATUS_TONE: Record<string, Tone> = { draft: "neutral", active: "success", archived: "warning" };
const ZONES = ["gcc", "europe", "egypt", "default"];
const FAMILIES = ["design", "development", "marketing", "it-support"];

function ServiceDialog({ service, onClose }: { service: Service; onClose: () => void }) {
  const t = useTranslations("Services");
  const tc = useTranslations("Common");
  const [name, setName] = useState<LocalizedValue>(service.name);
  const [status, setStatus] = useState<string>(service.status);
  const [days, setDays] = useState<number | null>(service.deliveryDays);
  const [pct, setPct] = useState<number | null>(service.subscriberDiscountPct);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [update, saving] = useUpdateServiceMutation();
  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.en?.trim() || !name.ar?.trim()) e.name = "required";
    if (!(days && days > 0)) e.deliveryDays = "required";
    if (!(pct !== null && pct >= 0 && pct <= 100)) e.subscriberDiscountPct = "range";
    setErrors(e);
    if (Object.keys(e).length) return;
    update({ id: service.id, name: { ...name, en: name.en ?? "" }, status, deliveryDays: days ?? service.deliveryDays, subscriberDiscountPct: pct ?? 0 })
      .unwrap()
      .then(() => {
        toast.success(t("catalogue.saved"));
        onClose();
      })
      .catch((x) => {
        const a = asApiError(x);
        if (a.status === 422 && a.fieldErrors) setErrors(a.fieldErrors);
        else toast.error(a.status === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("catalogue.editTitle")}</DialogTitle>
          <DialogDescription>{t("catalogue.dialogHelp")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {Object.keys(errors).length ? (
            <p role="alert" className="text-body-sm text-danger">
              {tc("fixFields")}
            </p>
          ) : null}
          <LocalizedField label={t("catalogue.name")} value={name} onChange={setName} required={["en", "ar"]} errors={errors.name ? { ...(name.en?.trim() ? {} : { en: tc("required") }), ...(name.ar?.trim() ? {} : { ar: tc("required") }) } : undefined} />
          <Field label={t("catalogue.status")} description={t("catalogue.statusHelp")}>
            <Select value={status} onValueChange={(v) => v && setStatus(v)} options={STATUSES.map((s) => ({ value: s, label: t(`catalogue.statuses.${s}`) }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("catalogue.deliveryDays")} description={t("catalogue.deliveryDaysHelp")} error={errors.deliveryDays ? t("catalogue.daysError") : undefined}>
              <NumberField value={days} onValueChange={setDays} min={1} max={365} step={1} />
            </Field>
            <Field label={t("catalogue.subscriberDiscount")} description={t("catalogue.subscriberDiscountHelp")} error={errors.subscriberDiscountPct ? t("catalogue.pctError") : undefined}>
              <PercentField value={pct} onValueChange={setPct} min={0} max={100} />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={saving.isLoading} onClick={submit}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Catalogue() {
  const t = useTranslations("Services");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const pick = usePick();
  const can = useCan();
  const editable = can("services:edit");
  const { data, isLoading, error, refetch } = useServicesQuery();
  // Zone currencies come from the pricing views; roles without them see the amounts alone.
  const zones = useServiceZonesQuery(undefined, { skip: !can("pricing:view") });
  const [editing, setEditing] = useState<Service | null>(null);
  const zoneName = (id: string) => (ZONES.includes(id) ? t(`zones.${id}`) : (zones.data?.find((z) => z.id === id)?.name ?? id));
  const zoneCurrency = (id: string) => zones.data?.find((z) => z.id === id)?.currency;

  const columns = useMemo<ColumnDef<Service, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("catalogue.service"),
        cell: ({ row }) => (
          <span className="flex min-w-44 flex-col gap-1">
            <span dir="auto" className="font-medium text-fg">
              {pick(row.original.name)}
            </span>
            <span className="text-caption text-fg-subtle">
              {FAMILIES.includes(row.original.family) ? t(`families.${row.original.family}`) : row.original.family} · {t(`catalogue.kinds.${row.original.kind}`)} · {t(`catalogue.billing.${row.original.billing}`)}
            </span>
          </span>
        ),
      },
      {
        id: "prices",
        header: t("catalogue.prices"),
        meta: { wrap: true },
        cell: ({ row }) =>
          row.original.prices ? (
            <dl className="grid min-w-56 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-body-sm">
              {Object.entries(row.original.prices).map(([zone, amount]) => (
                <div key={zone} className="contents">
                  <dt className="text-fg-muted">{zoneName(zone)}</dt>
                  <dd dir="ltr" className="text-end tabular-nums text-fg">
                    {amount === null ? <span className="text-fg-subtle">{t("catalogue.noPrice")}</span> : zoneCurrency(zone) ? f.money(amount, zoneCurrency(zone)!) : f.number(amount)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <Badge size="sm" tone="info">
              {t("catalogue.quoteOnly")}
            </Badge>
          ),
      },
      { id: "days", header: t("catalogue.deliveryDays"), meta: { numeric: true }, cell: ({ row }) => t("catalogue.days", { count: row.original.deliveryDays }) },
      { id: "pct", header: t("catalogue.subscriberDiscountShort"), meta: { numeric: true }, cell: ({ row }) => f.percent(row.original.subscriberDiscountPct / 100) },
      { id: "requests", header: t("catalogue.requests"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.requests) },
      {
        id: "status",
        header: t("catalogue.status"),
        cell: ({ row }) => (
          <Badge size="sm" tone={STATUS_TONE[row.original.status] ?? "neutral"}>
            {(STATUSES as readonly string[]).includes(row.original.status) ? t(`catalogue.statuses.${row.original.status}`) : row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) => (editable ? <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("catalogue.editFor", { name: pick(row.original.name) })} onClick={() => setEditing(row.original)} /> : null),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, f, editable, zones.data, pick],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("catalogue.title")} description={t("catalogue.description")} />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <DataTable label={t("catalogue.title")} columns={columns} data={data ?? []} getRowId={(r) => r.id} status={listStatus(isLoading, error)} paginate={false} onRetry={refetch} empty={{ title: t("catalogue.empty") }} />
      {editing ? <ServiceDialog service={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <RequirePermission permission="services:view">
      <Catalogue />
    </RequirePermission>
  );
}
