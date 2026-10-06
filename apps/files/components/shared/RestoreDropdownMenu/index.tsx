"use client";

// An archived file's or folder's actions: restore it, or (super admins) delete it for good. Same
// pattern as FileDropdownMenu: library Menu, and the dialogs outside it.
import { useState, type ReactElement, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, Trash } from "@phosphor-icons/react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@orgtik/ui";
import { RestoreDialog } from "@/components/dialogs/RestoreFolderDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { useRestoreFileMutation, useDeleteArchivedFileMutation, useDeleteArchivedFolderMutation, useRestoreFolderMutation } from "@/redux/features/archive/archiveApi";
import { IFile, IFolderArchive, IFolder } from "@/types";
import { useSessionAccess } from "@/hooks/useSessionAccess";

interface RestoreDropdownMenuProps {
  children: ReactNode;
  item?: IFile | IFolderArchive;
  type: "file" | "folder";
}

function RestoreDropdownMenu({ children, item, type }: RestoreDropdownMenuProps) {
  const t = useTranslations("Archived");
  const session = useSessionAccess();
  const isSuperAdmin = session?.isSuperAdmin || false;
  const [open, setOpen] = useState<null | "restore" | "delete">(null);
  const [restoreFile] = useRestoreFileMutation();
  const [restoreFolder] = useRestoreFolderMutation();
  const [deleteFile] = useDeleteArchivedFileMutation();
  const [deleteFolder] = useDeleteArchivedFolderMutation();
  const isFolder = type === "folder";
  const itemName = isFolder ? (item as IFolder).name : (item as IFile).displayName || (item as IFile).name;
  const dialog = (key: "restore" | "delete") => ({ open: open === key, onOpenChange: (o: boolean) => setOpen(o ? key : null) });

  const handleRestore = async (ids: (string | number)[]) => {
    if (isFolder) await restoreFolder(ids[0] as string).unwrap();
    else await restoreFile(ids[0] as string).unwrap();
  };
  const handleDelete = async (password: string) => {
    if (isFolder) await deleteFolder({ id: item?.id as string, password }).unwrap();
    else await deleteFile({ id: item?.id as string, password }).unwrap();
  };

  return (
    <>
      <Menu>
        <MenuTrigger render={children as ReactElement<Record<string, unknown>>} />
        <MenuContent align="end">
          <MenuItem icon={<ArrowCounterClockwise />} onClick={() => setOpen("restore")}>
            {t("restore")}
          </MenuItem>
          {isSuperAdmin ? (
            <>
              <MenuSeparator />
              <MenuItem tone="danger" icon={<Trash />} onClick={() => setOpen("delete")}>
                {t("deleteArchived")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
      <RestoreDialog itemId={item?.id as string} itemName={itemName} type={type} onRestore={handleRestore} {...dialog("restore")} />
      {isSuperAdmin ? <DeleteDialog id={item?.id as string} item={item as Parameters<typeof DeleteDialog>[0]["item"]} onDelete={(_, password) => handleDelete(String(password))} {...dialog("delete")} /> : null}
    </>
  );
}

export default RestoreDropdownMenu;
