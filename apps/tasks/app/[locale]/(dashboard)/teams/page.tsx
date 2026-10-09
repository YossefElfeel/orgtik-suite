"use client";

// The teams list (FS-TASKS-11) on the library's DataTable, server-paged, with the search, status and
// page in the address. A team's name is the link to it: the only link used to sit in a closed
// popover behind an unnamed menu button (TASKS-022). The status filter has its three real options
// (TASKS-025).
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowSquareOut, DotsThreeVertical, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { Avatar, Badge, Button, ConfirmDialog, Input, Menu, MenuContent, MenuItem, MenuLinkItem, MenuTrigger, PageHeader, SegmentedControl, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import CreateTeamDialog from "@/components/dialogs/teams/CreateTeamDialog";
import { AvatarStack } from "@/components/shared/AvatarStack";
import { useDeleteTeamMutation, useGetTeamsQuery } from "@/redux/features/teams/teamsApi";
import { useTaskRoles } from "@/lib/permissions";
import type { ITeam } from "@/types/teams";
import { isolate } from "@/lib/bidi";

type Status = "all" | "active" | "inactive";

// A component per row, so the delete hook isn't called inside a cell renderer (TASKS-062).
function TeamActions({ team }: { team: ITeam }) {
  const t = useTranslations("TeamList");
  const locale = useLocale();
  const { isManager } = useTaskRoles();
  const [deleteTeam] = useDeleteTeamMutation();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Menu>
        <MenuTrigger
          aria-label={t("actionsFor", { name: isolate(team.name) })}
          className="grid size-8 place-items-center rounded-pill text-fg-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
        >
          <DotsThreeVertical weight="bold" aria-hidden="true" className="size-5" />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuLinkItem href={`/${locale}/teams/${team.id}/overview`} icon={<ArrowSquareOut />}>
            {t("open")}
          </MenuLinkItem>
          {isManager ? (
            <MenuItem icon={<Trash />} tone="danger" onClick={() => setConfirm(true)}>
              {t("delete")}
            </MenuItem>
          ) : null}
        </MenuContent>
      </Menu>
      {isManager ? (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t("deleteTitle", { name: isolate(team.name) })}
          impact={t("deleteImpact", { count: team.memberCount ?? 0 })}
          irreversible
          confirmLabel={t("deleteConfirm")}
          cancelLabel={t("keep")}
          onConfirm={() => deleteTeam(team.id).unwrap()}
        />
      ) : null}
    </>
  );
}

export default function TeamsPage() {
  const t = useTranslations("TeamList");
  const f = useFormatter();
  const { isManager } = useTaskRoles();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = (["active", "inactive"].includes(params.get("status") ?? "") ? params.get("status") : "all") as Status;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [10].includes(Number(params.get("size"))) ? Number(params.get("size")) : 10;
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const go = (next: { status?: Status; page?: number; size?: number; q?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | undefined) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.status !== undefined) set("status", next.status === "all" ? undefined : next.status);
    if (next.q !== undefined) set("q", next.q.trim() || undefined);
    if (next.size !== undefined) set("size", next.size === 10 ? undefined : String(next.size));
    set("page", next.page && next.page > 1 ? String(next.page) : undefined);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`);
  };
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => go({ q: search }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useGetTeamsQuery({
    page,
    limit: pageSize,
    search: q || undefined,
    ...(status === "all" ? {} : { isActive: status === "active" }),
  });
  const items = data?.data?.items ?? [];

  const columns = useMemo<ColumnDef<ITeam>[]>(
    () => [
      {
        id: "name",
        header: t("team"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={row.original.name} src={row.original.teamImage || undefined} size="sm" decorative />
            <div className="flex min-w-0 flex-col">
              <Link
                href={`/teams/${row.original.id}/overview`}
                dir="auto"
                className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus"
              >
                {row.original.name}
              </Link>
              <span className="text-caption text-fg-muted">{t("members", { count: row.original.memberCount ?? 0 })}</span>
            </div>
          </div>
        ),
      },
      { id: "people", header: t("people"), cell: ({ row }) => <AvatarStack people={row.original.members ?? []} /> },
      {
        id: "status",
        header: t("status"),
        cell: ({ row }) => (
          <Badge tone={row.original.isActive ? "success" : "neutral"} size="sm">
            {row.original.isActive ? t("active") : t("inactive")}
          </Badge>
        ),
      },
      { id: "created", header: t("created"), meta: { numeric: true }, cell: ({ row }) => f.date(row.original.createdAt, { dateStyle: "medium" }) },
      {
        id: "alias",
        header: t("alias"),
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-mono text-body-sm">
            {row.original.alias}
          </bdi>
        ),
      },
      { id: "actions", header: () => <span className="sr-only">{t("actions")}</span>, meta: { width: "1%" }, cell: ({ row }) => <TeamActions team={row.original} /> },
    ],
    [t, f],
  );

  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const filtered = Boolean(q) || status !== "all";
  const create = isManager ? (
    <CreateTeamDialog
      trigger={
        <Button variant="primary" startIcon={<Plus />}>
          {t("create")}
        </Button>
      }
    />
  ) : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={create} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="md:max-w-sm"
        />
        <SegmentedControl<Status>
          label={t("status")}
          value={status}
          onValueChange={(v) => go({ status: v })}
          segments={[
            { value: "all", label: t("all") },
            { value: "active", label: t("active") },
            { value: "inactive", label: t("inactive") },
          ]}
        />
      </div>
      <DataTable
        label={t("title")}
        columns={columns}
        data={items}
        getRowId={(r) => String(r.id)}
        mode="server"
        rowCount={data?.data?.meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          go({ page: next.pageIndex + 1, size: next.pageSize });
        }}
        pageSizes={[10]}
        status={isLoading ? "loading" : isError ? ((error as { status?: number })?.status === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty"}
        onRetry={() => refetch()}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => go({ status: "all", q: "" })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: isManager ? t("emptyBody") : t("emptyBodyMember"), action: create ?? undefined }
        }
      />
    </section>
  );
}
