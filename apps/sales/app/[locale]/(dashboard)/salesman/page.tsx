"use client";

// The salespeople on the library's DataTable, paged by the server, with the search and page in the
// address. Admins add salespeople; managers read (the role matrix). `?new=1` opens the add form
// (the dashboard's "New salesperson" links here).
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button, Input, PageHeader } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { useRole } from "@/hooks/useRole";
import SalesmanDialog from "@/components/dialogs/salesman/SalesmanDialog";
import { useGetSalesmenQuery } from "@/redux/features/salesman/salesmanApi";
import { errorStatus, useSearchText, useUrlState } from "@/lib/commissions";
import { useSalesmanColumns } from "./columns";

export default function SalesmanPage() {
  const t = useTranslations("Team.salespeople");
  const { isAdmin, canEdit, isReady } = useRole();
  const url = useUrlState();
  const q = url.get("q");
  const [search, setSearch] = useSearchText(q, (v) => url.set({ q: v }));
  const list = useGetSalesmenQuery({ page: url.page, limit: url.size, ...(q ? { search: q } : {}) }, { skip: !isReady });
  const columns = useSalesmanColumns();
  const items = list.data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };
  const status = !isReady || list.isLoading ? "loading" : list.isError ? (errorStatus(list.error) === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty";

  const mayAdd = isAdmin && canEdit;
  const add = mayAdd ? (
    <Button variant="primary" startIcon={<Plus />} onClick={() => url.set({ new: 1, page: url.page })}>
      {t("add")}
    </Button>
  ) : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={isAdmin ? t("description") : t("descriptionManager")} actions={add} />
      {mayAdd ? <SalesmanDialog open={url.get("new") === "1"} onOpenChange={(next) => url.set({ new: next ? 1 : null, page: url.page })} /> : null}
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
        rowCount={list.data?.data?.meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          url.set({ page: next.pageIndex + 1, ...(next.pageSize !== url.size ? { size: next.pageSize } : {}) });
        }}
        pageSizes={url.pageSizes}
        status={status}
        onRetry={() => void list.refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        empty={
          q
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => url.set({ q: null })}>
                    {t("clearSearch")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: isAdmin ? t("emptyBody") : t("emptyBodyManager"), action: add ?? undefined }
        }
      />
    </section>
  );
}
