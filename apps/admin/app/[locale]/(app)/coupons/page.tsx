"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Plus } from "@phosphor-icons/react";
import { Badge, Button, IconButton, PageHeader, useFormatter, type Tone } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { CouponDialog, EndCouponButton, useCurrencyList } from "@/components/commerce/CouponDialog";
import { usePlanNames } from "@/components/commerce/plans";
import { listStatus } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { useCouponsQuery, type Coupon } from "@/store/commerce";

type CouponState = "active" | "scheduled" | "exhausted" | "expired" | "ended";
const couponState = (c: Coupon): CouponState =>
  c.expired ? "expired" : c.exhausted || c.redeemed >= c.maxRedemptions ? "exhausted" : !c.active ? "ended" : Date.parse(c.validFrom) > Date.now() ? "scheduled" : "active";
const TONE: Record<CouponState, Tone> = { active: "success", scheduled: "info", exhausted: "warning", expired: "neutral", ended: "neutral" };

function Coupons() {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const editable = can("bundles:edit");
  const currencyList = useCurrencyList();
  const { nameOf } = usePlanNames();
  const { data, isLoading, error, refetch } = useCouponsQuery();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);

  const columns = useMemo<ColumnDef<Coupon, unknown>[]>(
    () => [
      {
        id: "code",
        header: t("coupons.code"),
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span dir="ltr" className="font-mono text-body-sm font-medium text-fg">
              {row.original.code}
            </span>
            {row.original.note ? (
              <span dir="auto" className="max-w-56 truncate text-caption text-fg-subtle">
                {row.original.note}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: "discount",
        header: t("coupons.discount"),
        meta: { wrap: true },
        cell: ({ row }) =>
          row.original.kind === "percent" ? (
            t("coupons.percentOff", { value: row.original.value ?? 0 })
          ) : (
            <span className="flex flex-col gap-0.5">
              <span dir="ltr" className="tabular-nums">
                {Object.entries(row.original.amounts ?? {})
                  .map(([c, a]) => f.money(a, c))
                  .join(" · ")}
              </span>
              <span className="text-caption text-fg-subtle">{t("coupons.onlyInShort", { currencies: currencyList(Object.keys(row.original.amounts ?? {})) })}</span>
            </span>
          ),
      },
      { id: "applies", header: t("coupons.appliesTo"), cell: ({ row }) => (row.original.appliesTo === "all" ? t("coupons.allPlans") : nameOf(row.original.appliesTo)) },
      {
        id: "used",
        header: t("coupons.used"),
        meta: { numeric: true },
        cell: ({ row }) => t("coupons.usedOf", { count: row.original.redeemed, max: row.original.maxRedemptions }),
      },
      {
        id: "valid",
        header: t("coupons.validity"),
        cell: ({ row }) => t("coupons.validRange", { from: f.date(row.original.validFrom, { dateStyle: "medium" }), to: f.date(row.original.validTo, { dateStyle: "medium" }) }),
      },
      {
        id: "state",
        header: t("coupons.state"),
        cell: ({ row }) => {
          const s = couponState(row.original);
          return (
            <Badge size="sm" tone={TONE[s]}>
              {t(`coupons.states.${s}`)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) =>
          editable ? (
            <span className="inline-flex items-center gap-1">
              {row.original.active && !row.original.expired ? <EndCouponButton coupon={row.original} /> : null}
              <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("coupons.editFor", { code: row.original.code })} onClick={() => setEditing(row.original)} />
            </span>
          ) : null,
      },
    ],
    [t, f, currencyList, nameOf, editable],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("coupons.title")}
        description={t("coupons.description")}
        actions={editable ? <Button startIcon={<Plus />} onClick={() => setEditing("new")}>{t("coupons.create")}</Button> : null}
      />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <DataTable
        label={t("coupons.title")}
        columns={columns}
        data={data ?? []}
        getRowId={(r) => r.code}
        status={listStatus(isLoading, error)}
        paginate
        onRetry={refetch}
        empty={{ title: t("coupons.empty"), description: editable ? t("coupons.emptyBody") : undefined }}
      />
      {editing ? <CouponDialog coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

export default function CouponsPage() {
  return (
    <RequirePermission permission="bundles:view">
      <Coupons />
    </RequirePermission>
  );
}
