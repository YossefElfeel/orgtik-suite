"use client";

// Systems › Client CMSs (FS-SOS-9): the client websites SOS signs people in to. Each row shows the
// site's logo, name and address; its menu opens the accounts, edits, or deletes with what that
// removes. Titles use names, never ids.
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DotsThreeVertical, PencilSimple, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import { Button, ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger, PageHeader } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { useDeleteCMSInstanceMutation, useGetCMSInstancesQuery } from "@/redux/features/cms/cmsApi";
import { ICMSInstance } from "@/types/CMS";
import { SystemsNav } from "@/components/pages/systems/SystemsNav";
import { CmsDialog } from "@/components/pages/systems/CmsDialog";
import { CmsLogo } from "@/components/pages/systems/CmsLogo";

export default function CmsPage() {
  const t = useTranslations("Cms");
  const ts = useTranslations("Systems");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const { data, isLoading, isError, refetch } = useGetCMSInstancesQuery({ page: pagination.pageIndex + 1, limit: pagination.pageSize });
  const [remove] = useDeleteCMSInstanceMutation();
  const [editing, setEditing] = useState<ICMSInstance | "new" | null>(null);
  const [deleting, setDeleting] = useState<ICMSInstance | null>(null);

  const columns: ColumnDef<ICMSInstance>[] = [
    {
      id: "cms",
      header: t("colCms"),
      meta: { truncate: true },
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-3">
          <CmsLogo cms={row.original} />
          <Link href={`/systems/cms/${row.original.id}/accounts`} dir="auto" className="truncate font-semibold text-fg underline-offset-2 hover:underline">
            {row.original.name}
          </Link>
        </span>
      ),
    },
    {
      id: "site",
      header: t("colSite"),
      meta: { truncate: true },
      cell: ({ row }) =>
        row.original.domain ? (
          <a href={/^https?:/.test(row.original.domain) ? row.original.domain : `https://${row.original.domain}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="truncate text-fg-brand underline-offset-2 hover:underline">
            {row.original.domain.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{ts("colActions")}</span>,
      meta: { width: "1%" },
      cell: ({ row }) => {
        const cms = row.original;
        return (
          <Menu>
            <MenuTrigger render={<IconButton variant="ghost" size="sm" label={ts("actionsFor", { name: cms.name })} icon={<DotsThreeVertical weight="bold" />} />} />
            <MenuContent align="end">
              <MenuLinkItem icon={<UsersThree />} href={`/systems/cms/${cms.id}/accounts`}>
                {t("accounts")}
              </MenuLinkItem>
              <MenuItem icon={<PencilSimple />} onClick={() => setEditing(cms)}>
                {ts("edit")}
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" icon={<Trash />} onClick={() => setDeleting(cms)}>
                {t("delete")}
              </MenuItem>
            </MenuContent>
          </Menu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ts("title")}
        description={ts("pageDescription")}
        actions={
          <Button variant="primary" startIcon={<Plus />} onClick={() => setEditing("new")}>
            {t("add")}
          </Button>
        }
      />
      <SystemsNav />
      <DataTable
        label={ts("tabCms")}
        columns={columns}
        data={data?.data ?? []}
        getRowId={(c) => String(c.id)}
        mode="server"
        rowCount={Number(data?.meta?.total ?? 0)}
        pagination={pagination}
        onPaginationChange={setPagination}
        status={isLoading ? "loading" : isError ? "error" : "ready"}
        onRetry={refetch}
        empty={{ title: t("empty"), description: t("emptyBody"), action: <Button variant="primary" startIcon={<Plus />} onClick={() => setEditing("new")}>{t("add")}</Button> }}
      />
      <CmsDialog cms={editing === "new" ? null : editing} open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? t("deleteTitle", { name: deleting.name }) : ""}
        impact={deleting ? t("deleteImpact", { name: deleting.name }) : ""}
        confirmLabel={t("delete")}
        tone="danger"
        irreversible
        onConfirm={async () => {
          if (deleting) await remove(deleting.id).unwrap();
        }}
      />
    </div>
  );
}
