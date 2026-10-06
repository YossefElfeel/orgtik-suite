"use client";

// Who has the CRM, read-only (FS-SAL-4). Roles and access come from the `sales` scope in SOS, so
// they are changed there (SAL-006): Sales' own create, role, invite and disable actions wrote to
// records that decide nothing, and are gone. Admins get the link to SOS; managers read.
import { useTranslations } from "next-intl";
import { Info, MagnifyingGlass, ShieldCheck, UserGear, UsersThree, IdentificationBadge } from "@phosphor-icons/react";
import { Button, Input, PageHeader, Select, Stat } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { useRole } from "@/hooks/useRole";
import ManageInSosLink from "@/components/pages/user-management/ManageInSosLink";
import { useGetStaffQuery, useGetStaffStatsQuery } from "@/redux/features/staff/staffApi";
import { errorStatus, useSearchText, useTeamFormat, useUrlState } from "@/lib/commissions";
import { USER_ROLES, type UserRole } from "@/types/users";
import { useUserColumns } from "./columns";

const ALL = "all";

export default function UserManagementPage() {
  const t = useTranslations("Team.users");
  const f = useTeamFormat();
  const { isAdmin, isReady } = useRole();
  const url = useUrlState();
  const q = url.get("q");
  const role = (USER_ROLES as readonly string[]).includes(url.get("role")) ? (url.get("role") as UserRole) : null;
  const [search, setSearch] = useSearchText(q, (v) => url.set({ q: v }));
  const list = useGetStaffQuery({ page: url.page, limit: url.size, ...(q ? { search: q } : {}), ...(role ? { role } : {}) }, { skip: !isReady });
  const stats = useGetStaffStatsQuery(undefined, { skip: !isReady });
  const columns = useUserColumns();
  const items = list.data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: url.page - 1, pageSize: url.size };
  const filtered = Boolean(q || role);
  const s = stats.data?.data;
  const statsLoading = !isReady || stats.isLoading;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={<ManageInSosLink variant="primary" />} />

      <p className="flex items-start gap-2 rounded-card border border-line bg-sunken px-4 py-3 text-body-sm text-fg-muted">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-brand" />
        {isAdmin ? t("sosNoteAdmin") : t("sosNoteManager")}
      </p>

      {stats.isError ? null : (
        <section aria-label={t("statsLabel")} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={<UsersThree />} label={t("statTotal")} loading={statsLoading} value={f.number(s?.total ?? 0)} />
          <Stat icon={<ShieldCheck />} label={t("statAdmins")} loading={statsLoading} value={f.number(s?.admins ?? 0)} />
          <Stat icon={<UserGear />} label={t("statManagers")} loading={statsLoading} value={f.number(s?.managers ?? 0)} />
          <Stat icon={<IdentificationBadge />} label={t("statSalespeople")} loading={statsLoading} value={f.number(s?.salesmen ?? 0)} />
        </section>
      )}

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
          aria-label={t("filterRole")}
          value={role ?? ALL}
          onValueChange={(v) => url.set({ role: v && v !== ALL ? v : null })}
          options={[{ value: ALL, label: t("roleAll") }, ...USER_ROLES.map((r) => ({ value: r, label: t(`role.${r}`) }))]}
          className="md:w-56"
        />
      </div>

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
        status={!isReady || list.isLoading ? "loading" : list.isError ? (errorStatus(list.error) === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty"}
        onRetry={() => void list.refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        forbidden={{ title: t("noAccessTitle"), description: t("noAccessBody") }}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => url.set({ q: null, role: null })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: t("emptyBody"), action: <ManageInSosLink /> }
        }
      />
    </section>
  );
}
