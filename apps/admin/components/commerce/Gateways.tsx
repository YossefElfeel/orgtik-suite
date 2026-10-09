"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowsClockwise, Link as LinkIcon, PencilSimple, Path } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  NumberField,
  Select,
  Spinner,
  toast,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { asApiError, listStatus, useCountryName } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { useCommerceCountriesQuery, useCommerceCurrenciesQuery, useGatewaysQuery, useLazyGatewayRouteQuery, useUpdateGatewayMutation, type Gateway } from "@/store/commerce";

const METHODS = ["card", "wallet", "cash_code", "mada", "apple_pay", "google_pay", "knet"];

function useMethodName() {
  const t = useTranslations("Commerce");
  return (m: string) => (METHODS.includes(m) ? t(`gateways.methods.${m}`) : m);
}

function GatewayDialog({ gateway, onClose }: { gateway: Gateway; onClose: () => void }) {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const [priority, setPriority] = useState<number | null>(gateway.priority);
  const [recurring, setRecurring] = useState(gateway.recurring);
  const [active, setActive] = useState(gateway.active);
  const [update, saving] = useUpdateGatewayMutation();
  const submit = () =>
    update({ id: gateway.id, priority: priority ?? gateway.priority, recurring, active })
      .unwrap()
      .then(() => {
        toast.success(t("gateways.saved", { name: gateway.name }));
        onClose();
      })
      .catch((x) => toast.error(asApiError(x).status === 403 ? tc("forbidden") : tc("saveFailed")));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("gateways.editTitle", { name: gateway.name })}</DialogTitle>
          <DialogDescription>{t("gateways.dialogHelp")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <Field label={t("gateways.priority")} description={t("gateways.priorityHelp")}>
            <NumberField value={priority} onValueChange={setPriority} min={1} max={99} step={1} />
          </Field>
          <Checkbox checked={recurring} onCheckedChange={(v) => setRecurring(Boolean(v))} label={t("gateways.recurring")} description={t("gateways.recurringHelp")} />
          <Checkbox checked={active} onCheckedChange={(v) => setActive(Boolean(v))} label={t("gateways.activeLabel")} description={t("gateways.activeHelp")} />
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

/** Which gateways a customer in a country paying in a currency is offered, in order. */
function RouteTester() {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const country = useCountryName();
  const method = useMethodName();
  const countries = useCommerceCountriesQuery();
  const currencies = useCommerceCurrenciesQuery();
  const [c, setC] = useState<string | null>("EG");
  const [cur, setCur] = useState<string | null>("EGP");
  const [run, result] = useLazyGatewayRouteQuery();
  const asked = result.originalArgs;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="inline-flex items-center gap-2 font-display text-title-sm text-fg">
          <Path aria-hidden="true" className="size-5 text-fg-brand" />
          {t("gateways.routeTitle")}
        </h2>
        <p className="text-body-sm text-fg-muted">{t("gateways.routeHelp")}</p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (c && cur) run({ country: c, currency: cur });
        }}
      >
        <Field label={t("gateways.routeCountry")} className="min-w-44 flex-1">
          <Select value={c} onValueChange={setC} options={(countries.data ?? []).map((x) => ({ value: x.iso, label: country(x.iso) }))} />
        </Field>
        <Field label={t("gateways.routeCurrency")} className="min-w-32 flex-1">
          <Select value={cur} onValueChange={setCur} options={(currencies.data ?? []).map((x) => ({ value: x.code, label: x.code }))} />
        </Field>
        <Button type="submit" variant="secondary" disabled={!c || !cur} loading={result.isFetching}>
          {t("gateways.routeRun")}
        </Button>
      </form>
      <div aria-live="polite" className="flex flex-col gap-2">
        {result.isFetching ? (
          <Spinner label={tc("loading")} />
        ) : result.isError ? (
          <ErrorState size="compact" onRetry={() => asked && run(asked)} />
        ) : result.data && asked ? (
          result.data.length ? (
            <>
              <p className="text-body-sm text-fg">{t("gateways.routeResult", { count: result.data.length, country: country(asked.country), currency: asked.currency })}</p>
              <ol aria-label={t("gateways.routeListLabel")} className="flex flex-col gap-2">
                {result.data.map((g, i) => (
                  <li key={g.id} className="flex flex-wrap items-center gap-3 rounded-card border border-line p-3">
                    <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-pill bg-brand-subtle text-label text-fg-brand tabular-nums">
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <bdi className="font-medium text-fg">{g.name}</bdi>
                      <span className="text-caption text-fg-muted">
                        {g.methods.map((m, j) => (
                          <span key={m}>
                            {j ? " · " : null}
                            <bdi>{method(m)}</bdi>
                          </span>
                        ))}
                      </span>
                    </span>
                    <Badge size="sm" tone={g.recurring ? "success" : "info"} icon={g.recurring ? <ArrowsClockwise /> : <LinkIcon />}>
                      {g.recurring ? t("gateways.renewsAuto") : t("gateways.renewsByLink")}
                    </Badge>
                    {i === 0 ? <Badge size="sm" tone="brand">{t("gateways.first")}</Badge> : null}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <EmptyState size="compact" title={t("gateways.routeNone", { country: country(asked.country), currency: asked.currency })} description={t("gateways.routeNoneBody")} />
          )
        ) : null}
      </div>
    </Card>
  );
}

export function Gateways() {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const country = useCountryName();
  const method = useMethodName();
  const can = useCan();
  const editable = can("tax:edit");
  const { data, isLoading, error, refetch } = useGatewaysQuery();
  const [editing, setEditing] = useState<Gateway | null>(null);
  const rows = useMemo(() => (data ?? []).slice().sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)), [data]);

  const columns = useMemo<ColumnDef<Gateway, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("gateways.gateway"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span className="flex min-w-40 flex-col gap-1">
            <bdi className="font-medium text-fg">{row.original.name}</bdi>
            <span className="flex flex-wrap gap-1">
              {row.original.methods.map((m) => (
                <Badge key={m} size="sm" emphasis="outline">
                  <bdi>{method(m)}</bdi>
                </Badge>
              ))}
            </span>
          </span>
        ),
      },
      {
        id: "countries",
        header: t("gateways.countries"),
        meta: { wrap: true },
        cell: ({ row }) => <span className="block max-w-64 text-body-sm">{row.original.countries.map((c) => (c === "*" ? t("gateways.everywhere") : country(c))).join(", ")}</span>,
      },
      { id: "currencies", header: t("gateways.currencies"), cell: ({ row }) => <span dir="ltr">{row.original.currencies.join(" · ")}</span> },
      { id: "recurring", header: t("gateways.recurringShort"), cell: ({ row }) => (row.original.recurring ? t("gateways.renewsAuto") : t("gateways.renewsByLink")) },
      { id: "priority", header: t("gateways.priority"), meta: { numeric: true }, cell: ({ row }) => row.original.priority },
      {
        id: "active",
        header: t("gateways.state"),
        cell: ({ row }) => (
          <Badge size="sm" tone={row.original.active ? "success" : "neutral"}>
            {row.original.active ? t("gateways.on") : t("gateways.off")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) => (editable ? <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("gateways.editFor", { name: row.original.name })} onClick={() => setEditing(row.original)} /> : null),
      },
    ],
    [t, country, method, editable],
  );

  return (
    <div className="flex flex-col gap-6">
      <RouteTester />
      <section aria-labelledby="gw-list" className="flex flex-col gap-3">
        <h2 id="gw-list" className="font-display text-title-sm text-fg">
          {t("gateways.listTitle")}
        </h2>
        <p className="text-body-sm text-fg-muted">{editable ? t("gateways.listHelp") : tc("viewOnly")}</p>
        <DataTable label={t("gateways.listTitle")} columns={columns} data={rows} getRowId={(r) => r.id} status={listStatus(isLoading, error)} paginate onRetry={refetch} empty={{ title: t("gateways.empty") }} />
      </section>
      {editing ? <GatewayDialog gateway={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
