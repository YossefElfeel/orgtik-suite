"use client";

// Offers on the library's DataTable, paged and searched by the server, with the status tab, the
// search and the page in the address. Staff send offers (a salesperson for their own customers);
// a customer sees the offers made to them and answers them on the offer's page.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button, Input, PageHeader, Tabs, TabsList, TabsPanel } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import CreateOfferDialog from "@/components/dialogs/offers/CreateOfferDialog";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import { usePathname, useRouter } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { useGetOfferStatusCountsQuery, useGetOffersQuery } from "@/redux/features/offers/offersApi";
import { listStatus } from "@/lib/deals/query-state";
import { OFFER_STATUSES, type OfferStatus } from "@/types/offers";
import { useOfferColumns } from "./columns";

const ALL = "all";
const SIZES = [10, 25, 50];

export default function OffersPage() {
  const t = useTranslations("Offers");
  const statusLabel = useSalesStatusLabel();
  const { isCustomer, canEdit } = useRole();
  const canManage = !isCustomer && canEdit;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : 10;
  const q = params.get("q") ?? "";
  const status = (OFFER_STATUSES as string[]).includes(params.get("status") ?? "") ? (params.get("status") as OfferStatus) : null;
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const go = (next: { page?: number; size?: number; q?: string; status?: string | null }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | null | undefined) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.q !== undefined) set("q", next.q.trim() || null);
    if (next.status !== undefined) set("status", next.status);
    if (next.size !== undefined) set("size", next.size === 10 ? null : String(next.size));
    set("page", next.page && next.page > 1 ? String(next.page) : null);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`);
  };
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => go({ q: search }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useGetOffersQuery({ page, limit: pageSize, ...(status ? { status } : {}), ...(q ? { search: q } : {}) });
  const counts = useGetOfferStatusCountsQuery().data?.data;
  const items = data?.data?.items ?? [];
  const columns = useOfferColumns({ showCustomer: !isCustomer, canManage });
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const filtered = Boolean(q || status);

  const create = canManage ? (
    <CreateOfferDialog
      onSaved={(id) => router.push(`/offers/${id}`)}
      trigger={
        <Button variant="primary" startIcon={<Plus aria-hidden className="size-4" />}>
          {t("newOffer")}
        </Button>
      }
    />
  ) : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={isCustomer ? t("titleCustomer") : t("title")} description={isCustomer ? t("descriptionCustomer") : t("description")} actions={create} />
      <Tabs value={status ?? ALL} onValueChange={(v) => go({ status: v === ALL ? null : String(v) })}>
        <TabsList
          items={[
            { value: ALL, label: t("tabAll"), count: counts?.all },
            ...OFFER_STATUSES.map((s) => ({ value: s, label: statusLabel("offer", s), count: counts?.[s] })),
          ]}
        />
        <TabsPanel value={status ?? ALL} className="flex flex-col gap-4 pt-4">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<MagnifyingGlass />}
            placeholder={t("search")}
            aria-label={t("search")}
            className="md:max-w-sm"
          />
          <DataTable
            label={t("title")}
            columns={columns}
            data={items}
            getRowId={(r) => r.id}
            mode="server"
            rowCount={data?.data?.meta?.total ?? 0}
            pagination={pagination}
            onPaginationChange={(u) => {
              const next = typeof u === "function" ? u(pagination) : u;
              go({ page: next.pageIndex + 1, size: next.pageSize });
            }}
            pageSizes={SIZES}
            status={listStatus({ isLoading, isError, error, count: items.length })}
            onRetry={() => void refetch()}
            error={{ title: t("errorTitle"), description: t("errorBody") }}
            forbidden={{ title: t("forbiddenTitle"), description: t("forbiddenBody") }}
            empty={
              filtered
                ? {
                    title: t("noMatchTitle"),
                    description: t("noMatchBody"),
                    action: (
                      <Button variant="secondary" onClick={() => go({ q: "", status: null })}>
                        {t("clearFilters")}
                      </Button>
                    ),
                  }
                : { title: t("emptyTitle"), description: canManage ? t("emptyBody") : t("emptyBodyCustomer"), action: create ?? undefined }
            }
          />
        </TabsPanel>
      </Tabs>
    </section>
  );
}
