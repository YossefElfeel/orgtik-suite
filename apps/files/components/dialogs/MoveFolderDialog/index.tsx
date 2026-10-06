"use client";

// Move a file or folder: pick where it goes in the folder tree. Each folder is a real button
// (selected state announced with aria-pressed) with its own expand button, so the tree works by
// keyboard; nothing moves until a destination is chosen.
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretRight, Folder, HouseSimple } from "@phosphor-icons/react";
import { IconButton, Spinner, toast } from "@orgtik/ui";
import { BaseDialog } from "../BaseDialog";
import { useGetFoldersQuery, useMoveFolderMutation } from "@/redux/features/folder/folderApi";
import { useMoveFileMutation } from "@/redux/features/file/fileApi";
import { cn } from "@/lib/utils";
import { IFile, IFolder, IFolderPinned } from "@/types";
import { canUseMoveDestination, isCollaboratorMoveSource } from "@/lib/permissions";

interface MoveFolderDialogProps {
  id: string | number;
  itemName: string;
  type: "file" | "folder";
  /** The file or folder being moved: collaborators can only move within what's shared with them. */
  source?: IFile | IFolder | IFolderPinned;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type TreeProps = {
  folder: IFolder;
  selected: string | null;
  onSelect: (id: string) => void;
  depth?: number;
  invalidFolderId: string | null;
  source?: IFile | IFolder | IFolderPinned;
  restrictToSharedSubtree: boolean;
};

const rowClass = (on: boolean) =>
  cn("flex min-w-0 flex-1 items-center gap-2 rounded-field px-2 py-2 text-start text-body-sm transition-colors", on ? "bg-brand-subtle font-medium text-fg-brand" : "text-fg hover:bg-hover");

function FolderTreeItem({ folder, selected, onSelect, depth = 0, invalidFolderId, source, restrictToSharedSubtree }: TreeProps) {
  const t = useTranslations("Dialogs.move");
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useGetFoldersQuery({ parentId: String(folder.id), limit: 100 }, { skip: !isOpen });
  const children = (data?.data?.items || []).filter((child: IFolder) => String(child.id) !== String(invalidFolderId) && (!restrictToSharedSubtree || !source || canUseMoveDestination(source, child)));
  const on = selected === String(folder.id);
  return (
    <li>
      <div className="flex items-center gap-1" style={{ paddingInlineStart: `${depth * 1.25}rem` }}>
        <IconButton
          size="sm"
          variant="ghost"
          label={t(isOpen ? "collapse" : "expand", { name: folder.name })}
          aria-expanded={isOpen}
          icon={<CaretRight className={cn("transition-transform rtl:-scale-x-100", isOpen && "rotate-90 rtl:-rotate-90")} />}
          onClick={() => setIsOpen((o) => !o)}
        />
        <button type="button" aria-pressed={on} className={rowClass(on)} onClick={() => onSelect(String(folder.id))}>
          <Folder weight={on ? "fill" : "duotone"} aria-hidden="true" className="size-5 shrink-0" />
          <span dir="auto" className="truncate">
            {folder.name}
          </span>
        </button>
      </div>
      {isOpen ? (
        isLoading ? (
          <div className="py-2 text-caption text-fg-subtle" style={{ paddingInlineStart: `${(depth + 1) * 1.25 + 2.5}rem` }}>
            {t("loading")}
          </div>
        ) : children.length === 0 ? (
          <div className="py-2 text-caption text-fg-subtle" style={{ paddingInlineStart: `${(depth + 1) * 1.25 + 2.5}rem` }}>
            {t("empty")}
          </div>
        ) : (
          <ul>
            {children.map((child: IFolder) => (
              <FolderTreeItem key={child.id} folder={child} selected={selected} onSelect={onSelect} depth={depth + 1} invalidFolderId={invalidFolderId} source={source} restrictToSharedSubtree={restrictToSharedSubtree} />
            ))}
          </ul>
        )
      ) : null}
    </li>
  );
}

export function MoveFolderDialog({ id, itemName, type, source, children, open, onOpenChange }: MoveFolderDialogProps) {
  const t = useTranslations("Dialogs.move");
  const tc = useTranslations("Common");
  const [selected, setSelected] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const { data, isLoading } = useGetFoldersQuery({ limit: 100 });
  const [moveFolder] = useMoveFolderMutation();
  const [moveFile] = useMoveFileMutation();

  const invalidFolderId = type === "folder" ? String(id) : null;
  const restrictToSharedSubtree = source ? isCollaboratorMoveSource(source) : false;
  const sharedRootId = source?.capabilities?.sharedRootId ?? null;
  const rootFolders = (data?.data?.items || []).filter((f: IFolder) => {
    if (String(f.id) === String(invalidFolderId)) return false;
    const isRoot = !f.parentId || String(f.parentId) === "null";
    if (restrictToSharedSubtree && source) return String(f.id) === String(sharedRootId) || (isRoot && canUseMoveDestination(source, f));
    return isRoot;
  });
  const choose = (v: string) => (setSelected(v), setMissing(false));

  const handleMove = async () => {
    if (selected === null) {
      setMissing(true);
      throw new Error("no destination");
    }
    try {
      const target = selected === "root" ? {} : type === "folder" ? { targetParentId: selected } : { targetFolderId: selected };
      if (type === "folder") await moveFolder({ id: String(id), ...target }).unwrap();
      else await moveFile({ id: String(id), ...target }).unwrap();
      toast.success(t("moved"));
      setSelected(null);
    } catch (e) {
      toast.error(t("failed"));
      throw e;
    }
  };

  const content = (
    <div className="flex flex-col gap-3">
      <p className="text-body-sm font-medium text-fg">{t("to")}</p>
      {restrictToSharedSubtree ? <p className="text-body-sm text-fg-muted">{t("sharedOnly")}</p> : null}
      <div className="max-h-80 overflow-y-auto rounded-field border border-line p-2" role="group" aria-label={t("to")}>
        {!restrictToSharedSubtree ? (
          <div className="flex items-center gap-1 ps-9">
            <button type="button" aria-pressed={selected === "root"} className={rowClass(selected === "root")} onClick={() => choose("root")}>
              <HouseSimple weight={selected === "root" ? "fill" : "duotone"} aria-hidden="true" className="size-5 shrink-0" />
              {t("root")}
            </button>
          </div>
        ) : null}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner label={t("loading")} />
          </div>
        ) : rootFolders.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-fg-subtle">{t("empty")}</p>
        ) : (
          <ul className="mt-1">
            {rootFolders.map((folder: IFolder) => (
              <FolderTreeItem key={folder.id} folder={folder} selected={selected} onSelect={choose} invalidFolderId={invalidFolderId} source={source} restrictToSharedSubtree={restrictToSharedSubtree} />
            ))}
          </ul>
        )}
      </div>
      {missing ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("pick")}
        </p>
      ) : null}
    </div>
  );

  return (
    <BaseDialog
      title={t("title", { name: itemName })}
      size="md"
      content={content}
      submitText={tc("move")}
      cancelText={tc("cancel")}
      onSubmit={handleMove}
      onCancel={() => (setSelected(null), setMissing(false))}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </BaseDialog>
  );
}
