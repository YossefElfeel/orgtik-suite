"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge, Input, PageHeader, Select } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { useMeQuery, useRolesQuery } from "@/store/api";

const MODULES = [
  "overview",
  "content",
  "pages",
  "media",
  "seo",
  "marketing",
  "localization",
  "settings",
  "legal",
  "claims",
  "pricing",
  "leads",
  "site",
  "locales",
  "users",
];
const ACTIONS: Record<string, string> = {
  view: "view",
  edit: "edit",
  approve: "approve",
  manage: "manage",
  pii: "personalData",
  visibility: "siteIndexing",
  enable: "enableLanguages",
  "custom-jsonld": "structuredData",
};
export function RoleComparison() {
  const t = useTranslations("Team");
  const ti = useTranslations("Improvements");
  const tr = useTranslations("Roles");
  const me = useMeQuery();
  const query = useRolesQuery();
  const mine = new Set(me.data?.roles.map((role) => role.key));
  const [search, setSearch] = useState("");
  const [roleKey, setRoleKey] = useState("all");
  const rows = MODULES.map((key) => ({
    key,
    label: ti(`capabilityGroups.${key}`),
  }));
  const columns: ColumnDef<(typeof rows)[number]>[] = [
    {
      accessorKey: "label",
      header: ti("capability"),
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.label}</span>
      ),
    },
    ...(query.data ?? []).filter(role=>roleKey==="all"||role.key===roleKey).map((role) => ({
      id: role.key,
      header: () => (
        <div className="flex flex-col gap-1">
          <span>{tr(role.key)}</span>
          {mine.has(role.key) ? (
            <Badge size="sm" tone="brand">
              {t("yours")}
            </Badge>
          ) : null}
        </div>
      ),
      cell: ({ row }: { row: { original: (typeof rows)[number] } }) => {
        const actions = role.permissions
          .filter((permission) => permission.startsWith(`${row.original.key}:`))
          .map((permission) => permission.split(":")[1]);
        return (
          <div className="flex flex-wrap gap-1">
            {actions.length ? (
              actions.map((action) => (
                <Badge
                  key={action}
                  tone={
                    action === "view"
                      ? "neutral"
                      : action === "approve" || action === "manage"
                        ? "brand"
                        : "success"
                  }
                  size="sm"
                >
                  {ti(ACTIONS[action])}
                </Badge>
              ))
            ) : (
              <span className="text-caption text-fg-muted">
                {ti("noAccess")}
              </span>
            )}
          </div>
        );
      },
    })),
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={ti("roleComparison")} description={ti("roleComparisonHelp")} />
      <div className="wm-table-filters"><Input size="sm" className="wm-search" aria-label={ti("rolesSearch")} placeholder={ti("rolesSearch")} value={search} onChange={event=>setSearch(event.target.value)} /><Select size="sm" aria-label={ti("allRoles")} value={roleKey} onValueChange={value=>setRoleKey(value??"all")} options={[{value:"all",label:ti("allRoles")},...(query.data??[]).map(role=>({value:role.key,label:tr(role.key)}))]} /></div>
      <div className="flex flex-wrap gap-3" aria-label={ti("roleComparison")}><Badge tone="neutral">{ti("view")}</Badge><Badge tone="success">{ti("edit")}</Badge><Badge tone="brand">{ti("approve")} / {ti("manage")}</Badge></div>
      <DataTable
        empty={{ title: ti("noResults") }}
        label={ti("roleComparison")}
        columns={columns.map((column) => ({ ...column, enableSorting: false }))}
        data={rows.filter(row=>row.label.toLowerCase().includes(search.toLowerCase()))}
        getRowId={(row) => row.key}
        status={query.isLoading ? "loading" : query.isError ? "error" : "ready"}
        onRetry={query.refetch}
      />
    </div>
  );
}
