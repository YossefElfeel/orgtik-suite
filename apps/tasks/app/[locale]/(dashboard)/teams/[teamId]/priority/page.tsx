"use client";

// The team's tasks by priority, on the library's DataTable (server paging, the page in the address).
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { usePathname, useRouter } from "@/i18n/routing";
import PriorityBadge from "@/components/shared/PriorityBadge";
import { useTeamId } from "@/components/pages/team/TeamFrame";
import { useGetTeamTasksQuery } from "@/redux/features/teams/teamsApi";
import { dueDay } from "@/lib/dates";
import type { ITeamPriority } from "@/types/teams";

const PAGE_SIZE = 10;

export default function TeamPriorityPage() {
  const t = useTranslations("TeamPage");
  const f = useFormatter();
  const id = useTeamId() ?? 0;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const { data, isLoading, isError, refetch } = useGetTeamTasksQuery({ page, id });
  const items = data?.data?.items ?? [];

  const columns = useMemo<ColumnDef<ITeamPriority>[]>(
    () => [
      { id: "name", header: t("task"), meta: { truncate: true }, cell: ({ row }) => <span dir="auto">{row.original.name}</span> },
      { id: "priority", header: t("priority"), cell: ({ row }) => <PriorityBadge priority={row.original.priority} size="sm" /> },
      { id: "due", header: t("due"), meta: { numeric: true }, cell: ({ row }) => (row.original.dueDate ? f.date(dueDay(row.original.dueDate), { dateStyle: "medium", timeZone: "UTC" }) : t("noDue")) },
    ],
    [t, f],
  );
  const pagination: PaginationState = { pageIndex: page - 1, pageSize: PAGE_SIZE };

  return (
    <DataTable
      label={t("tabs.priority")}
      columns={columns}
      data={items}
      getRowId={(r) => `${r.name}-${r.dueDate}`}
      mode="server"
      rowCount={data?.data?.meta?.total ?? 0}
      pagination={pagination}
      onPaginationChange={(u) => {
        const next = typeof u === "function" ? u(pagination) : u;
        router.replace(next.pageIndex ? `${pathname}?page=${next.pageIndex + 1}` : pathname);
      }}
      pageSizes={[PAGE_SIZE]}
      status={isLoading ? "loading" : isError ? "error" : items.length ? "ready" : "empty"}
      onRetry={() => refetch()}
      empty={{ title: t("noTasksTitle"), description: t("noTasksBody") }}
    />
  );
}
