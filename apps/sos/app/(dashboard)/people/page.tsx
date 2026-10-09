"use client";

// People (FS-SOS-4). The list's state lives in the address: search, filters and page survive
// paging, reload and a shared link (paging used to drop every filter), and a new search or filter
// starts again from page 1. Every outcome has its state: loading, error with retry, nobody yet,
// no match (with "clear filters"). Acting on a person goes through their row's menu; the risky
// actions say what they do before they do it, and none of them applies to your own account.
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { Button, ConfirmDialog, Input, PageHeader, Select } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import AddOrEditUserDialog from "@/components/dialogs/teams/AddOrEditUserDialog";
import EditUserTypeDialog, { USER_TYPES } from "@/components/dialogs/teams/EditUserTypeDialog";
import { IPeopleItem } from "@/types/user";
import { useDeleteUserMutation, useGetUserQuery, useGetUsersQuery, useUpdateUserMutation } from "@/redux/features/users/usersApi";
import { useGetAllScopesQuery } from "@/redux/features/scopes/scopesApi";
import { useLoginAsMutation } from "@/redux/features/auth/authApi";
import { useAppLabel } from "@/components/suite/useSuiteApps";
import useUser from "@/hooks/use-user";
import { personName, usePeopleColumns, type PersonAction } from "./columns";

const PAGE_SIZES = [10];
// The "all" choice of each filter (the Select treats an empty value as no choice).
const ALL = "all";

export default function PeoplePage() {
  const t = useTranslations("People");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const appLabel = useAppLabel();
  const { user: me, isAdmin } = useUser();

  // The address is the source of truth.
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = PAGE_SIZES.includes(Number(params.get("limit"))) ? Number(params.get("limit")) : 10;
  const search = params.get("search") ?? "";
  const scope = params.get("scope") ?? "";
  const userType = params.get("userType") ?? "";
  const status = params.get("isActive") ?? "";

  const setParams = (next: Record<string, string | number | null>, resetPage = true) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || (k === "page" && v === 1) || (k === "limit" && v === 10)) q.delete(k);
      else q.set(k, String(v));
    }
    if (resetPage && !("page" in next)) q.delete("page");
    router.replace(`${pathname}${q.toString() ? `?${q}` : ""}`, { scroll: false });
  };

  // The search box types freely; the address follows a moment later.
  const [typed, setTyped] = useState(search);
  useEffect(() => setTyped(search), [search]);
  useEffect(() => {
    if (typed === search) return;
    const id = setTimeout(() => setParams({ search: typed.trim() }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  const { data: scopesData } = useGetAllScopesQuery();
  const { data, isLoading, isError, isFetching, refetch } = useGetUsersQuery({
    page,
    limit,
    search: search || undefined,
    scope: scope || undefined,
    userType: userType || undefined,
    isActive: status === "" ? undefined : status === "true",
  });
  const people = data?.data ?? [];
  const total = Number(data?.meta?.total ?? 0);
  const filtered = Boolean(search || scope || userType || status);

  const toolOptions = useMemo(
    () => [{ value: ALL, label: t("allTools") }, ...(scopesData?.data ?? []).filter((s) => s.isActive !== false && s.name !== "global").map((s) => ({ value: s.name, label: appLabel(s.name, s.displayName || s.name) }))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopesData, t],
  );
  const typeOptions = [{ value: ALL, label: t("allTypes") }, ...USER_TYPES.map((v) => ({ value: v, label: t(`types.${v}`) }))];
  const statusOptions = [
    { value: ALL, label: t("allStatuses") },
    { value: "true", label: t("active") },
    { value: "false", label: t("inactive") },
  ];

  // One person, one action at a time; the dialogs live here, outside the row menus.
  const [target, setTarget] = useState<{ action: PersonAction | "add"; person: IPeopleItem | null } | null>(null);
  const close = () => setTarget(null);
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [loginAs] = useLoginAsMutation();
  const columns = usePeopleColumns({
    meId: me?.id,
    canLoginAs: Boolean(isAdmin),
    onAction: (action, person) => {
      if (action === "activate") {
        updateUser({ userId: person.id, data: { isActive: true } }).catch(() => {});
        return;
      }
      setTarget({ action, person });
    },
  });

  // Other apps link to "View as" for one person: /people?viewAs=<id> opens the same confirmation (D-017).
  const viewAsId = Number(params.get("viewAs")) || 0;
  const { data: viewAsUser } = useGetUserQuery(viewAsId, { skip: !viewAsId || !isAdmin });
  useEffect(() => {
    const u = viewAsUser?.data;
    if (!u || target) return;
    setTarget({
      action: "loginAs",
      person: { ...u, managerId: u.managerId ?? null, profile: u.profile ?? null, scopes: [], createdAt: String(u.createdAt), updatedAt: String(u.updatedAt), deletedAt: null },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAsUser]);

  const person = target?.person ?? null;
  const name = person ? personName(person) : "";
  const pagination: PaginationState = { pageIndex: page - 1, pageSize: limit };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="primary" startIcon={<Plus />} onClick={() => setTarget({ action: "add", person: null })}>
            {t("add")}
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <Input
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          startIcon={<MagnifyingGlass />}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="min-w-56 flex-1"
        />
        <Select aria-label={t("filterTool")} options={toolOptions} value={scope || ALL} onValueChange={(v) => setParams({ scope: v === ALL ? "" : (v ?? "") })} className="w-44" />
        <Select aria-label={t("filterType")} options={typeOptions} value={userType || ALL} onValueChange={(v) => setParams({ userType: v === ALL ? "" : (v ?? "") })} className="w-40" />
        <Select aria-label={t("filterStatus")} options={statusOptions} value={status || ALL} onValueChange={(v) => setParams({ isActive: v === ALL ? "" : (v ?? "") })} className="w-36" />
        {filtered ? (
          <Button variant="ghost" startIcon={<X />} onClick={() => router.replace(pathname, { scroll: false })}>
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={people}
        getRowId={(p) => String(p.id)}
        mode="server"
        rowCount={total}
        pagination={pagination}
        onPaginationChange={(updater) => {
          const next = typeof updater === "function" ? updater(pagination) : updater;
          setParams({ page: next.pageIndex + 1, limit: next.pageSize }, false);
        }}
        pageSizes={PAGE_SIZES}
        status={isLoading ? "loading" : isError ? "error" : "ready"}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70 transition-opacity" : undefined}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => router.replace(pathname, { scroll: false })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : {
                title: t("emptyTitle"),
                description: t("emptyBody"),
                action: (
                  <Button variant="primary" startIcon={<Plus />} onClick={() => setTarget({ action: "add", person: null })}>
                    {t("add")}
                  </Button>
                ),
              }
        }
      />

      <AddOrEditUserDialog open={target?.action === "add" || target?.action === "edit"} onOpenChange={(open) => !open && close()} user={target?.action === "edit" ? person : null} />
      <EditUserTypeDialog user={target?.action === "type" ? person : null} open={target?.action === "type"} onOpenChange={(open) => !open && close()} />

      <ConfirmDialog
        open={target?.action === "deactivate"}
        onOpenChange={(open) => !open && close()}
        title={t("deactivateTitle", { name })}
        impact={t("deactivateImpact", { name })}
        confirmLabel={t("deactivate")}
        tone="danger"
        onConfirm={async () => {
          if (person) await updateUser({ userId: person.id, data: { isActive: false } }).unwrap();
        }}
      />
      <ConfirmDialog
        open={target?.action === "delete"}
        onOpenChange={(open) => !open && close()}
        title={t("deleteTitle", { name })}
        impact={t("deleteImpact", { name })}
        confirmLabel={t("delete")}
        tone="danger"
        irreversible
        onConfirm={async () => {
          if (person) await deleteUser(person.id).unwrap();
        }}
      />
      <ConfirmDialog
        open={target?.action === "loginAs"}
        onOpenChange={(open) => !open && close()}
        title={t("loginAsTitle", { name })}
        impact={t("loginAsImpact", { name })}
        confirmLabel={t("loginAs")}
        tone="primary"
        onConfirm={async () => {
          if (!person) return;
          await loginAs(person.id).unwrap();
          router.push("/");
        }}
      />
    </div>
  );
}
