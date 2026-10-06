"use client";
// The workspace's service requests (USR-16, spec 05): number, title, service, status, what happens
// next, the quoted amount and when it was asked. The page is in the address so a link opens it.
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { PageHeader, StatusBadge, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import useWorkspace from "@/hooks/use-workspace";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useGetServiceRequestsQuery, type ServiceRequest } from "@/redux/features/platform/services";
import { useLocalized } from "@/components/workspace/account/problems";
import { nextStep, requestBadge } from "./status";

const PAGE_SIZE = 25;

export function RequestsList() {
  const t = useTranslations("Services.requests");
  const ts = useTranslations("Services");
  const f = useFormatter();
  const name = useLocalized();
  const ws = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const { data, isLoading, isError, isFetching, refetch } = useGetServiceRequestsQuery({ page, pageSize: PAGE_SIZE });
  const isOwner = ws.isOwner;

  const columns: ColumnDef<ServiceRequest>[] = [
    {
      id: "number",
      header: t("colNumber"),
      cell: ({ row }) => (
        <Link href={`/services/requests/${encodeURIComponent(row.original.id)}`} dir="ltr" className="font-semibold whitespace-nowrap text-fg-brand underline-offset-2 hover:underline">
          {row.original.number}
        </Link>
      ),
    },
    {
      id: "title",
      header: t("colTitle"),
      meta: { truncate: true },
      cell: ({ row }) => (
        <span dir="auto" className="truncate text-fg">
          {row.original.title}
        </span>
      ),
    },
    { id: "service", header: t("colService"), cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{name(row.original.service)}</span> },
    { id: "status", header: t("colStatus"), cell: ({ row }) => <StatusBadge entity="service_request" state={requestBadge(row.original.state)} viewer="customer" /> },
    {
      id: "next",
      header: t("colNext"),
      cell: ({ row }) => {
        const step = nextStep(row.original);
        // Accepting and paying are the owner's; others see who does it.
        const key = (step === "quote" || step === "pay") && !isOwner ? `${step}Owner` : step;
        return <span className="whitespace-nowrap text-fg-muted">{t(`next.${key}`)}</span>;
      },
    },
    {
      id: "amount",
      header: t("colAmount"),
      meta: { numeric: true },
      cell: ({ row }) =>
        row.original.quote ? (
          <span dir="ltr" className="whitespace-nowrap tabular-nums">
            {f.money(row.original.quote.total, row.original.quote.currency)}
          </span>
        ) : row.original.state === "new" || row.original.state === "under_review" ? (
          <span className="whitespace-nowrap text-fg-muted">{t("noAmount")}</span>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
    },
    { id: "created", header: t("colCreated"), meta: { numeric: true }, cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{f.date(row.original.createdAt, { dateStyle: "medium" })}</span> },
  ];
  const pagination: PaginationState = { pageIndex: page - 1, pageSize: PAGE_SIZE };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumb={[{ label: ts("title"), href: "/services" }, { label: t("title") }]}
        actions={
          ws.isAdmin ? (
            <ButtonLink href="/services" variant="primary">
              <Plus aria-hidden="true" />
              {t("new")}
            </ButtonLink>
          ) : null
        }
      />
      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          const q = new URLSearchParams(params.toString());
          if (next.pageIndex) q.set("page", String(next.pageIndex + 1));
          else q.delete("page");
          router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
        }}
        pageSizes={[PAGE_SIZE]}
        status={isLoading ? "loading" : isError ? "error" : "ready"}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70 transition-opacity" : undefined}
        empty={{
          title: t("emptyTitle"),
          description: ws.isAdmin ? t("emptyBody") : t("emptyBodyMember"),
          action: (
            <ButtonLink href="/services" variant="secondary">
              {t("browse")}
            </ButtonLink>
          ),
        }}
      />
    </div>
  );
}
