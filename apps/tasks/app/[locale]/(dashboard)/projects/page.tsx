"use client";

// The projects list (FS-TASKS-10). The search, status and page live in the address, so a reload
// or a shared link shows the same list (TASKS-053), and the default is every project: a new one
// starts "To do", which the old default ("In progress") hid (TASKS-015).
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FolderSimple, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button, Input, ListStates, PageHeader, Pagination, Select, SegmentedControl, Toolbar, useStatusLabel, type ListStatus } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import ProjectCard from "@/components/pages/projects/ProjectCard";
import ProjectFormDialog from "@/components/dialogs/projects/ProjectFormDialog";
import { useGetAllProjectsQuery } from "@/redux/features/projects/projectsApi";
import { useTaskRoles } from "@/lib/permissions";
import type { IProjectStatus } from "@/types/projects";

const PAGE_SIZE = 9;
type Filter = "all" | IProjectStatus;

export default function ProjectsPage() {
  const t = useTranslations("ProjectList");
  const tv = useTranslations("TasksV3");
  const statusLabel = useStatusLabel();
  const { isManager } = useTaskRoles();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = (["todo", "in_progress", "done"].includes(params.get("status") ?? "") ? params.get("status") : "all") as Filter;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = params.get("q") ?? "";
  const archived = params.get("archived") === "true";
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const go = (next: { status?: Filter; page?: number; q?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | undefined) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.status !== undefined) set("status", next.status === "all" ? undefined : next.status);
    if (next.q !== undefined) set("q", next.q.trim() || undefined);
    // A new filter or search starts from the first page.
    set("page", next.page && next.page > 1 ? String(next.page) : undefined);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`);
  };
  // Search as the person types, a moment after they stop.
  useEffect(() => {
    if (search === q) return;
    const id = setTimeout(() => go({ q: search }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useGetAllProjectsQuery({ page, limit: PAGE_SIZE, search: q, status: status === "all" ? "" : status, archived: archived ? "true" : "false" });
  const items = data?.data?.items ?? [];
  const total = data?.data?.meta?.total ?? 0;
  const filtered = Boolean(q) || status !== "all";
  const listStatus: ListStatus = isLoading ? "loading" : isError ? ((error as { status?: number })?.status === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty";

  const create = isManager ? (
    <ProjectFormDialog
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
      <Toolbar label={t("statusFilter")}>
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="md:max-w-sm"
        />
        <SegmentedControl<Filter>
          label={t("statusFilter")}
          value={status}
          onValueChange={(v) => go({ status: v })}
          segments={[
            { value: "all", label: t("all") },
            { value: "todo", label: statusLabel("task", "todo") },
            { value: "in_progress", label: statusLabel("task", "in_progress") },
            { value: "done", label: statusLabel("task", "done") },
          ]}
        />
        <Select aria-label={tv("project")} value={archived ? "archived" : "active"} options={[{ value: "active", label: tv("active") }, { value: "archived", label: tv("archived") }]} onValueChange={value => { const sp = new URLSearchParams(params.toString()); sp.delete("page"); if (value === "archived") sp.set("archived", "true"); else sp.delete("archived"); router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`); }} className="w-48" />
      </Toolbar>
      <ListStates
        status={listStatus}
        onRetry={() => refetch()}
        loadingRows={6}
        empty={
          filtered
            ? {
                icon: <MagnifyingGlass weight="duotone" />,
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => go({ status: "all", q: "" })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { icon: <FolderSimple weight="duotone" />, title: t("emptyTitle"), description: isManager ? t("emptyBody") : t("emptyBodyMember"), action: create ?? undefined }
        }
      >
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
        {total > PAGE_SIZE ? <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={(p) => go({ page: p })} /> : null}
      </ListStates>
    </section>
  );
}
