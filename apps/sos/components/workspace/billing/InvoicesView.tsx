"use client";
// Invoices (USR-10): every issued invoice of the workspace, newest first, paged. The page lives in
// the address (?page=), so a link opens the same view. Each number opens the invoice.
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader, StatusBadge } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { useBillingInvoicesQuery, type InvoiceSummary } from "@/redux/features/platform/billing";
import { Money, useDay } from "./shared";

const PAGE_SIZES = [10, 25, 50];

export function InvoicesView() {
  const t = useTranslations("Billing.invoices");
  const tb = useTranslations("Billing");
  const day = useDay();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = PAGE_SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : 25;
  const { data, isLoading, isError, isFetching, refetch } = useBillingInvoicesQuery({ page, pageSize });

  const columns: ColumnDef<InvoiceSummary>[] = [
    {
      id: "number",
      header: t("number"),
      cell: ({ row }) => (
        <Link href={`/billing/invoices/${encodeURIComponent(row.original.id)}`} className="font-medium text-fg-brand underline-offset-2 hover:underline focus-visible:underline">
          <span dir="ltr">{row.original.number}</span>
        </Link>
      ),
    },
    {
      id: "total",
      header: t("total"),
      meta: { numeric: true },
      cell: ({ row }) => (
        <span className="flex flex-col items-end">
          <Money amount={row.original.total} currency={row.original.currency} className="font-medium" />
          {row.original.refunded > 0 ? (
            <span className="text-caption text-fg-muted">{t.rich("refunded", { amount: () => <Money amount={row.original.refunded} currency={row.original.currency} /> })}</span>
          ) : null}
        </span>
      ),
    },
    { id: "state", header: t("state"), cell: ({ row }) => <StatusBadge entity="invoice" state={row.original.state} viewer="customer" /> },
    { id: "issued", header: t("issued"), meta: { numeric: true }, cell: ({ row }) => day(row.original.issuedAt) },
    { id: "due", header: t("due"), meta: { numeric: true }, cell: ({ row }) => day(row.original.dueAt) },
    { id: "paid", header: t("paid"), meta: { numeric: true }, cell: ({ row }) => (row.original.paidAt ? day(row.original.paidAt) : <span className="text-fg-muted">{t("notPaid")}</span>) },
  ];

  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const go = (next: PaginationState) => {
    const q = new URLSearchParams(params.toString());
    if (next.pageIndex > 0) q.set("page", String(next.pageIndex + 1));
    else q.delete("page");
    if (next.pageSize !== 25) q.set("size", String(next.pageSize));
    else q.delete("size");
    router.replace(`${pathname}${q.toString() ? `?${q}` : ""}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(i) => i.id}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => go(typeof u === "function" ? u(pagination) : u)}
        pageSizes={PAGE_SIZES}
        status={isLoading ? "loading" : isError ? "error" : "ready"}
        onRetry={refetch}
        error={{ title: t("failed"), description: tb("tryAgain") }}
        className={`[&_th:first-child]:sticky [&_th:first-child]:start-0 [&_th:first-child]:z-10 [&_th:first-child]:bg-raised [&_td:first-child]:sticky [&_td:first-child]:start-0 [&_td:first-child]:bg-raised ${isFetching && !isLoading ? "opacity-70 transition-opacity" : ""}`}
        empty={{ title: t("emptyTitle"), description: t("emptyBody") }}
      />
    </div>
  );
}
