"use client";

// Projects (a salesperson's deals) on the library's DataTable. Search, status, priority and the
// page are filtered by the server and kept in the address (the priority filter used to sift only
// the page on screen, SAL-079). Customers see their own projects.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button, Input, PageHeader, Select } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import CreateUpdateProjectDialog from "@/components/dialogs/projects/CreateUpdateProjectDialog";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import { usePathname, useRouter } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { useGetProjectsQuery } from "@/redux/features/projects/projectsApi";
import { listStatus } from "@/lib/deals/query-state";
import { PROJECT_PRIORITIES, PROJECT_STATUSES, type ProjectPriority } from "@/types/projects";
import { useProjectColumns } from "./columns";

const ALL = "all";
const SIZES = [10];

export default function ProjectsPage() {
  const t = useTranslations("Projects");
  const statusLabel = useSalesStatusLabel();
  const { isAdmin, isManager, isSalesman, isCustomer, canEdit } = useRole();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : 10;
  const q = params.get("q") ?? "";
  const status = (PROJECT_STATUSES as readonly string[]).includes(params.get("status") ?? "") ? (params.get("status") as string) : null;
  const priority = (PROJECT_PRIORITIES as string[]).includes(params.get("priority") ?? "") ? (params.get("priority") as ProjectPriority) : null;
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const go = (next: { page?: number; size?: number; q?: string; status?: string | null; priority?: string | null; new?: null }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | null | undefined) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.new !== undefined) sp.delete("new");
    if (next.q !== undefined) set("q", next.q.trim() || null);
    if (next.status !== undefined) set("status", next.status);
    if (next.priority !== undefined) set("priority", next.priority);
    if (next.size !== undefined) set("size", next.size === 10 ? null : String(next.size));
    if (next.page !== undefined || next.new === undefined) set("page", next.page && next.page > 1 ? String(next.page) : null);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`);
  };
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => go({ q: search }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useGetProjectsQuery({
    page,
    limit: pageSize,
    ...(q ? { search: q } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  });
  const items = data?.data?.items ?? [];
  const canCreate = !isCustomer && canEdit;
  const columns = useProjectColumns({ showCustomer: !isCustomer, showSalesman: isAdmin || isManager, showPriority: !isCustomer, canDelete: (isAdmin || isManager) && canEdit });
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const filtered = Boolean(q || status || priority);
  const title = isSalesman ? t("titleSalesman") : isCustomer ? t("titleCustomer") : t("title");

  // The dashboard's "New project" links here with ?new=1: the deal builder opens, and closing it
  // clears the parameter.
  const wantsNew = params.get("new") === "1" && canCreate;

  const create = canCreate ? (
    <CreateUpdateProjectDialog
      onSaved={(id) => router.push(`/projects/${id}`)}
      trigger={
        <Button variant="primary" startIcon={<Plus aria-hidden className="size-4" />}>
          {isSalesman ? t("newDeal") : t("newProject")}
        </Button>
      }
    />
  ) : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={title} description={isCustomer ? t("descriptionCustomer") : t("description")} actions={create} />
      {wantsNew ? (
        <CreateUpdateProjectDialog
          open
          onOpenChange={(o) => {
            if (!o) go({ new: null });
          }}
          onSaved={(id) => router.push(`/projects/${id}`)}
        />
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="md:max-w-sm"
        />
        <Select
          aria-label={t("filterStatus")}
          value={status ?? ALL}
          onValueChange={(v) => go({ status: !v || v === ALL ? null : v })}
          options={[{ value: ALL, label: t("allStatuses") }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: statusLabel("project", s) }))]}
          className="md:w-56"
        />
        {isCustomer ? null : (
        <Select
          aria-label={t("filterPriority")}
          value={priority ?? ALL}
          onValueChange={(v) => go({ priority: !v || v === ALL ? null : v })}
          options={[{ value: ALL, label: t("allPriorities") }, ...PROJECT_PRIORITIES.map((p) => ({ value: p, label: t(`priority.${p}`) }))]}
          className="md:w-48"
        />
        )}
      </div>
      <DataTable
        label={title}
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
                  <Button variant="secondary" onClick={() => go({ q: "", status: null, priority: null })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: canCreate ? t("emptyBody") : t("emptyBodyCustomer"), action: create ?? undefined }
        }
      />
    </section>
  );
}
