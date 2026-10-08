"use client";

// The campaigns list on the library's DataTable, paged by the server, with search, type and status
// in the address so a reload keeps them. New campaign opens an empty wizard (MKT-009).
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button, Input, PageHeader, Select } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { usePathname, useRouter } from "@/i18n/routing";
import { useGetCampaignsQuery } from "@/redux/features/campaigns/campaignsApi";
import { useMarketingRoles } from "@/lib/permissions";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { useMarketingStatusLabel } from "@/components/shared/MarketingStatus";
import { getDefaultCampaignNewPath } from "@/lib/campaigns/routing";
import { OBJECTIVE_TO_API_TYPE } from "@/lib/campaigns/workflow";
import { CAMPAIGN_OBJECTIVE_VALUES } from "@/constants/campaigns";
import type { CampaignApiType } from "@/types/campaigns";
import { useCampaignColumns } from "./columns";

const STATUSES = ["DRAFT", "AWAITING_REVIEW", "REJECTED", "READY", "RUNNING", "PAUSED", "COMPLETED", "FAILED"] as const;
const TYPES = CAMPAIGN_OBJECTIVE_VALUES.map((o) => OBJECTIVE_TO_API_TYPE[o]);
const ALL = "all";

export default function CampaignsPage() {
  const t = useTranslations("Campaigns");
  const labels = useCampaignLabels();
  const statusLabel = useMarketingStatusLabel();
  const { editCampaigns } = useMarketingRoles();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [10].includes(Number(params.get("size"))) ? Number(params.get("size")) : 10;
  const q = params.get("q") ?? "";
  const type = (TYPES as string[]).includes(params.get("type") ?? "") ? (params.get("type") as CampaignApiType) : null;
  const status = (STATUSES as readonly string[]).includes(params.get("status") ?? "") ? params.get("status") : null;
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const go = (next: { page?: number; size?: number; q?: string; type?: string | null; status?: string | null }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | null | undefined) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.q !== undefined) set("q", next.q.trim() || null);
    if (next.type !== undefined) set("type", next.type);
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

  const { data, isLoading, isError, error, refetch } = useGetCampaignsQuery({ page, limit: pageSize, ...(q ? { search: q } : {}), ...(type ? { type } : {}), ...(status ? { status } : {}) });
  const items = data?.data?.items ?? [];
  const columns = useCampaignColumns();
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const filtered = Boolean(q || type || status);
  const create = editCampaigns ? (
    <ButtonLink href={getDefaultCampaignNewPath()} variant="primary">
      <Plus aria-hidden className="size-4" />
      {t("create")}
    </ButtonLink>
  ) : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={create} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} startIcon={<MagnifyingGlass />} placeholder={t("search")} aria-label={t("search")} className="md:max-w-sm" />
        <Select
          aria-label={t("filterType")}
          value={type ?? ALL}
          onValueChange={(v) => go({ type: v === ALL ? null : v })}
          options={[{ value: ALL, label: t("allTypes") }, ...TYPES.map((tp) => ({ value: tp, label: labels.type(tp) }))]}
          className="md:w-56"
        />
        <Select
          aria-label={t("filterStatus")}
          value={status ?? ALL}
          onValueChange={(v) => go({ status: v === ALL ? null : v })}
          options={[{ value: ALL, label: t("allStatuses") }, ...STATUSES.map((s) => ({ value: s, label: statusLabel("campaign", s) }))]}
          className="md:w-56"
        />
      </div>
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
        pageSizes={[10]}
        status={isLoading ? "loading" : isError ? ((error as { status?: number })?.status === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty"}
        onRetry={() => void refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => go({ q: "", type: null, status: null })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: editCampaigns ? t("emptyBody") : t("emptyBodyViewer"), action: create ?? undefined }
        }
      />
    </section>
  );
}
