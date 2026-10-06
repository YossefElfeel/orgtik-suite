"use client";

// The team's people, on the library's DataTable: search and page in the address (the old pager
// pointed at a /members page that doesn't exist, TASKS-023).
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Avatar, Button, Input } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { usePathname, useRouter } from "@/i18n/routing";
import PersonSheet from "@/components/pages/team/PersonSheet";
import { useTeamId } from "@/components/pages/team/TeamFrame";
import { useGetTeamMembersQuery } from "@/redux/features/teams/teamsApi";
import type { ITeamMembers } from "@/types/teams";

const PAGE_SIZE = 10;
const full = (p?: { firstName?: string; lastName?: string } | null) => (p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : "");

export default function TeamMembersPage() {
  const t = useTranslations("TeamPage");
  const id = useTeamId() ?? 0;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);
  const go = (next: { q?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const query = (next.q ?? q).trim();
    if (query) sp.set("q", query);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`);
  };
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => go({ q: search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isLoading, isError, refetch } = useGetTeamMembersQuery({ id, page, search: q || undefined });
  const items = data?.data?.items ?? [];
  const columns = useMemo<ColumnDef<ITeamMembers>[]>(
    () => [
      {
        id: "name",
        header: t("person"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={full(row.original)} src={row.original.avatar || undefined} size="sm" decorative />
            <div className="flex min-w-0 flex-col">
              <span dir="auto" className="truncate font-semibold text-fg">
                {full(row.original)}
              </span>
              {row.original.profile?.jobTitle ? (
                <span dir="auto" className="truncate text-caption text-fg-muted">
                  {row.original.profile.jobTitle}
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "manager",
        header: t("manager"),
        cell: ({ row }) => {
          const m = (row.original as ITeamMembers & { manager?: { firstName?: string; lastName?: string; avatar?: string } }).manager;
          return m ? (
            <span className="inline-flex items-center gap-2">
              <Avatar name={full(m)} src={m.avatar || undefined} size="xs" decorative />
              <span dir="auto">{full(m)}</span>
            </span>
          ) : (
            <span className="text-fg-subtle">{t("noManager")}</span>
          );
        },
      },
      {
        id: "email",
        header: t("email"),
        cell: ({ row }) => (
          <bdi dir="ltr" className="text-body-sm">
            {row.original.email}
          </bdi>
        ),
      },
      { id: "work", header: () => <span className="sr-only">{t("work")}</span>, meta: { width: "1%" }, cell: ({ row }) => <PersonSheet userId={row.original.id} name={full(row.original)} /> },
    ],
    [t],
  );
  const pagination: PaginationState = { pageIndex: page - 1, pageSize: PAGE_SIZE };

  return (
    <div className="flex flex-col gap-4">
      <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} startIcon={<MagnifyingGlass />} placeholder={t("searchPeople")} aria-label={t("searchPeople")} className="md:max-w-sm" />
      <DataTable
        label={t("tabs.team")}
        columns={columns}
        data={items}
        getRowId={(r) => String(r.id)}
        mode="server"
        rowCount={data?.data?.meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          go({ page: next.pageIndex + 1 });
        }}
        pageSizes={[PAGE_SIZE]}
        status={isLoading ? "loading" : isError ? "error" : items.length ? "ready" : "empty"}
        onRetry={() => refetch()}
        empty={
          q
            ? { title: t("noPeopleMatch"), action: <Button variant="secondary" onClick={() => go({ q: "" })}>{t("clearSearch")}</Button> }
            : { title: t("noPeopleTitle"), description: t("noPeopleBody") }
        }
      />
    </div>
  );
}
