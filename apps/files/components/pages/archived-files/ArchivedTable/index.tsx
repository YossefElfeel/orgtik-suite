"use client";

// Archived files on the library's DataTable (FS-FILES-5): server paging, selection with bulk
// restore (and delete for good, for super admins), every state from the library, every word
// translated, sizes and dates in the reader's language.
import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, Trash } from "@phosphor-icons/react";
import { Button, useFormatter, type ListStatus } from "@orgtik/ui";
import { DataTable, type ColumnDef, type RowSelectionState } from "@orgtik/ui/table";
import { useBulkRestoreFilesMutation, useGetArchivedFilesAndFoldersQuery, useGetArchivedFolderContentsQuery } from "@/redux/features/archive/archiveApi";
import { usePermanentDeleteFilesMutation } from "@/redux/features/file/fileApi";
import { IFile } from "@/types";
import RestoreDropdownMenu from "@/components/shared/RestoreDropdownMenu";
import { RowActionsButton } from "@/components/shared/RowActionsButton";
import { PermanentDeleteDialog } from "@/components/dialogs/PermanentDeleteDialog";
import { RestoreDialog } from "@/components/dialogs/RestoreFolderDialog";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";

export default function ArchivedTable({ parentId }: { parentId?: string }) {
  const t = useTranslations("Archived");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const session = useSessionAccess();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [selection, setSelection] = useState<RowSelectionState>({});
  const args = { page: pagination.pageIndex + 1, limit: pagination.pageSize };
  const contents = useGetArchivedFolderContentsQuery({ id: parentId!, ...args }, { skip: !parentId });
  const root = useGetArchivedFilesAndFoldersQuery({ ...args, fileUsage: "all" }, { skip: !!parentId });
  const q = parentId ? contents : root;
  const files = (q.data?.data?.files?.items || []) as IFile[];
  const total = q.data?.data?.files?.meta?.total ?? files.length;
  const [bulkRestoreFiles] = useBulkRestoreFilesMutation();
  const [permanentDeleteFiles] = usePermanentDeleteFilesMutation();
  const status: ListStatus = q.isLoading ? "loading" : q.isError ? ((q.error as { status?: number })?.status === 403 ? "forbidden" : "error") : "ready";

  const columns = useMemo<ColumnDef<IFile, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("colName"),
        enableSorting: false,
        meta: { truncate: true },
        cell: ({ row }) => {
          const name = row.original.displayName || row.original.name;
          return (
            <span className="inline-flex max-w-full items-center gap-3">
              <FileTypeIcon name={row.original.name} mimeType={row.original.mimeType} />
              <span dir="auto" className="truncate font-semibold text-fg">
                {name}
              </span>
            </span>
          );
        },
      },
      { accessorKey: "size", header: t("colSize"), enableSorting: false, meta: { numeric: true }, cell: ({ getValue }) => <span className="text-fg-muted">{f.bytes(Number(getValue() || 0))}</span> },
      { id: "location", header: t("colLocation"), enableSorting: false, cell: ({ row }) => <span dir="auto" className="text-fg-muted">{row.original.folder?.name || tc("root")}</span> },
      {
        id: "owner",
        header: t("colOwner"),
        enableSorting: false,
        cell: ({ row }) => {
          const o = row.original.owner as { firstName?: string; lastName?: string; username?: string } | undefined;
          return <bdi className="text-fg-muted">{o ? [o.firstName, o.lastName].filter(Boolean).join(" ") || o.username : "–"}</bdi>;
        },
      },
      { accessorKey: "deletedAt", header: t("colArchivedAt"), enableSorting: false, cell: ({ getValue }) => <span className="text-fg-muted">{getValue() ? f.date(getValue() as string, { dateStyle: "medium" }) : "–"}</span> },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("colName")}</span>,
        meta: { numeric: true },
        cell: ({ row }) => (
          <RestoreDropdownMenu item={row.original} type="file">
            <RowActionsButton name={row.original.displayName || row.original.name} />
          </RestoreDropdownMenu>
        ),
      },
    ],
    [t, tc, f],
  );

  return (
    <DataTable
      label={t("tableLabel")}
      mode="server"
      columns={columns}
      data={files}
      getRowId={(file) => String(file.id)}
      rowCount={total}
      status={status}
      empty={{ title: t("emptyFiles"), description: t("emptyFilesBody") }}
      onRetry={q.refetch}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginate={total > 25}
      selectable
      rowSelection={selection}
      onRowSelectionChange={setSelection}
      bulkActions={(rows) => {
        const ids = rows.map((r) => String(r.original.id));
        return (
          <>
            <RestoreDialog ids={ids} type="file" onRestore={async (list) => (await bulkRestoreFiles({ ids: list as string[] }).unwrap(), setSelection({}))}>
              <Button size="sm" startIcon={<ArrowCounterClockwise />}>
                {t("restoreSelected")}
              </Button>
            </RestoreDialog>
            {session?.isSuperAdmin ? (
              <PermanentDeleteDialog ids={ids} onSuccess={() => setSelection({})} onDelete={(d) => permanentDeleteFiles(d)}>
                <Button size="sm" variant="danger" startIcon={<Trash />}>
                  {t("deleteSelected")}
                </Button>
              </PermanentDeleteDialog>
            ) : null}
          </>
        );
      }}
    />
  );
}
