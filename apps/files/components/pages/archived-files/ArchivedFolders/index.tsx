"use client";

// Archived folders as cards (FS-FILES-5): select them with real checkboxes and restore or delete
// several at once; open one to see what's inside; each has its own menu.
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, FolderSimple, Trash, X } from "@phosphor-icons/react";
import { Button, Checkbox, EmptyState, ErrorState, IconButton, Pagination, Skeleton, useFormatter } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useBulkRestoreFoldersMutation, useGetArchivedFilesAndFoldersQuery, useGetArchivedFolderContentsQuery } from "@/redux/features/archive/archiveApi";
import { usePermanentDeleteFoldersMutation } from "@/redux/features/folder/folderApi";
import { IFolderArchive } from "@/types";
import RestoreDropdownMenu from "@/components/shared/RestoreDropdownMenu";
import { RowActionsButton } from "@/components/shared/RowActionsButton";
import { PermanentDeleteDialog } from "@/components/dialogs/PermanentDeleteDialog";
import { RestoreDialog } from "@/components/dialogs/RestoreFolderDialog";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { cn } from "@/lib/utils";

const PAGE = 12;

const ArchivedFolders = ({ parentId }: { parentId?: string }) => {
  const t = useTranslations("Archived");
  const session = useSessionAccess();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const contents = useGetArchivedFolderContentsQuery({ id: parentId!, page, limit: PAGE }, { skip: !parentId });
  const root = useGetArchivedFilesAndFoldersQuery({ page, limit: PAGE, fileUsage: "all" }, { skip: !!parentId });
  const q = parentId ? contents : root;
  const folders = (q.data?.data?.folders?.items || []) as IFolderArchive[];
  const total = q.data?.data?.folders?.meta?.total ?? folders.length;
  const [permanentDeleteFolders] = usePermanentDeleteFoldersMutation();
  const [bulkRestoreFolders, { isLoading: restoring }] = useBulkRestoreFoldersMutation();
  const toggle = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  if (q.isLoading)
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-card" />
        ))}
      </div>
    );
  if (q.isError) return <ErrorState size="compact" onRetry={q.refetch} />;
  if (folders.length === 0) return <EmptyState size="compact" icon={<FolderSimple />} title={t("emptyFolders")} />;

  return (
    <div className="flex flex-col gap-4">
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-field border border-line bg-brand-subtle p-3">
          <IconButton size="sm" variant="ghost" label={t("clearSelection")} icon={<X />} onClick={() => setSelectedIds([])} />
          <span className="me-auto text-body-sm font-semibold text-fg">{t("selected", { count: selectedIds.length })}</span>
          <RestoreDialog ids={selectedIds} type="folder" onRestore={async (ids) => (await bulkRestoreFolders({ ids: ids as string[] }).unwrap(), setSelectedIds([]))}>
            <Button size="sm" startIcon={<ArrowCounterClockwise />} loading={restoring}>
              {t("restoreSelected")}
            </Button>
          </RestoreDialog>
          {session?.isSuperAdmin ? (
            <PermanentDeleteDialog ids={selectedIds} onSuccess={() => setSelectedIds([])} onDelete={(d) => permanentDeleteFolders(d)}>
              <Button size="sm" variant="danger" startIcon={<Trash />}>
                {t("deleteSelected")}
              </Button>
            </PermanentDeleteDialog>
          ) : null}
        </div>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {folders.map((folder) => (
          <li key={folder.id}>
            <ArchivedFolderCard folder={folder} isSelected={selectedIds.includes(folder.id)} onToggle={() => toggle(folder.id)} />
          </li>
        ))}
      </ul>
      {total > PAGE ? <Pagination page={page} pageSize={PAGE} total={total} onPageChange={setPage} /> : null}
    </div>
  );
};

function ArchivedFolderCard({ folder, isSelected, onToggle }: { folder: IFolderArchive; isSelected: boolean; onToggle: () => void }) {
  const t = useTranslations("Archived");
  const f = useFormatter();
  const when = folder.deletedAt || folder.updatedAt;
  return (
    <div className={cn("flex items-center gap-3 rounded-card border bg-raised p-3 transition-colors", isSelected ? "border-action-primary bg-brand-subtle" : "border-line hover:border-line-strong")}>
      <Checkbox aria-label={t("selectItem", { name: folder.name })} checked={isSelected} onCheckedChange={onToggle} />
      <Link href={`/archived-files/${folder.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-field focus-visible:outline-2 focus-visible:outline-focus">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-field bg-sunken text-fg-brand [&>svg]:size-6">
          <FolderSimple weight="duotone" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span dir="auto" className="truncate text-body-sm font-medium text-fg">
            {folder.name}
          </span>
          {when ? <span className="text-caption text-fg-subtle">{t("archivedOn", { date: f.date(when, { dateStyle: "medium" }) })}</span> : null}
        </span>
      </Link>
      <RestoreDropdownMenu item={folder} type="folder">
        <RowActionsButton name={folder.name} />
      </RestoreDropdownMenu>
    </div>
  );
}

export default ArchivedFolders;
