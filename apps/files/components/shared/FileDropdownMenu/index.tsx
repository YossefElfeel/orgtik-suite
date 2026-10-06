"use client";

// A file's or folder's actions (Files wave, FS-FILES-1). The menu is the library's (Base UI, like
// every dialog it opens), and an item only opens its dialog: the dialogs live outside the menu, so
// closing the menu never closes the dialog (the old one kept dialogs inside menu items open with
// preventDefault).
import { useState, type ReactElement, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Archive, ArrowSquareOut, CheckCircle, DownloadSimple, Info, PencilSimple, ShareNetwork, Star } from "@phosphor-icons/react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@orgtik/ui";
import { RenameDialog } from "@/components/dialogs/RenameDialog";
import { DetailsDialog } from "@/components/dialogs/DetailsDialog";
import { ArchiveDialog } from "@/components/dialogs/ArchiveDialog";
import { MarkAsUsedDialog } from "@/components/dialogs/MarkAsUsedDialog";
import { MoveFolderDialog } from "@/components/dialogs/MoveFolderDialog";
import { ShareFileDialog } from "@/components/dialogs/ShareFileDialog";
import { useArchiveFileMutation, useUpdateFileMutation } from "@/redux/features/file/fileApi";
import { useArchiveFolderMutation, usePinFolderMutation, useUnpinFolderMutation, useUpdateFolderMutation } from "@/redux/features/folder/folderApi";
import { IFile, IFolder, IFolderPinned } from "@/types";
import { useFileActions } from "@/hooks/useFileActions";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { canArchiveResource, canManageAccess, canManageExternalShares, canMoveResource, canWriteResource } from "@/lib/permissions";

interface FileDropdownMenuProps {
  /** The button that opens the menu (an IconButton with its label). */
  children: ReactNode;
  item: IFile | IFolder | IFolderPinned;
  type: "file" | "folder";
}

type Open = null | "rename" | "share" | "move" | "used" | "details" | "archive";

function FileDropdownMenu({ children, item, type }: FileDropdownMenuProps) {
  const t = useTranslations("Common");
  const { handleDownload } = useFileActions();
  const session = useSessionAccess();
  const [open, setOpen] = useState<Open>(null);
  const [archiveFile] = useArchiveFileMutation();
  const [archiveFolder] = useArchiveFolderMutation();
  const [pinFolder] = usePinFolderMutation();
  const [unpinFolder] = useUnpinFolderMutation();
  const [updateFile] = useUpdateFileMutation();
  const [updateFolder] = useUpdateFolderMutation();

  const isFolder = type === "folder";
  const folder = item as IFolder;
  const file = item as IFile;
  const itemName = isFolder ? folder.name : file.displayName || file.name;
  const canWrite = session ? canWriteResource(item, session) : false;
  const canMove = session ? canMoveResource(item, session) : false;
  const canArchive = session ? canArchiveResource(item, session) : false;
  const showInternalAccess = session ? canManageAccess(item, session) : false;
  const showExternalShares = session ? canManageExternalShares(item, session) : false;
  const showShare = showInternalAccess || showExternalShares;
  const dialog = (key: Exclude<Open, null>) => ({ open: open === key, onOpenChange: (o: boolean) => setOpen(o ? key : null) });

  const handleArchive = async () => {
    if (isFolder) await archiveFolder(item.id).unwrap();
    else await archiveFile(item.id).unwrap();
  };
  const handlePin = async () => {
    if (!isFolder) return;
    if (folder.isPinned) await unpinFolder(item.id).unwrap();
    else await pinFolder(item.id).unwrap();
  };
  const handleRename = async (id: string | number, newName: string) => {
    if (isFolder) await updateFolder({ id: String(id), name: newName }).unwrap();
    else await updateFile({ id: String(id), name: newName }).unwrap();
  };

  return (
    <>
      <Menu>
        <MenuTrigger render={children as ReactElement<Record<string, unknown>>} />
        <MenuContent align="end">
          {canWrite ? (
            <MenuItem icon={<PencilSimple />} onClick={() => setOpen("rename")}>
              {t("rename")}
            </MenuItem>
          ) : null}
          {showShare ? (
            <MenuItem icon={<ShareNetwork />} onClick={() => setOpen("share")}>
              {t("shareWith")}
            </MenuItem>
          ) : null}
          {canMove ? (
            <MenuItem icon={<ArrowSquareOut />} onClick={() => setOpen("move")}>
              {t("moveTo")}
            </MenuItem>
          ) : null}
          <MenuItem icon={<DownloadSimple />} onClick={() => handleDownload(item, type)}>
            {t("download")}
          </MenuItem>
          {canWrite && !isFolder ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<CheckCircle weight={file.isUsed ? "fill" : "regular"} />} onClick={() => setOpen("used")}>
                {file.isUsed ? t("markedAsUsed") : t("markAsUsed")}
              </MenuItem>
            </>
          ) : null}
          <MenuSeparator />
          {isFolder ? (
            <MenuItem icon={<Star weight={folder.isPinned ? "fill" : "regular"} />} onClick={handlePin}>
              {folder.isPinned ? t("unpinFromDashboard") : t("pinToDashboard")}
            </MenuItem>
          ) : null}
          <MenuItem icon={<Info />} onClick={() => setOpen("details")}>
            {t("details")}
          </MenuItem>
          {canArchive ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<Archive />} onClick={() => setOpen("archive")}>
                {t("archive")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>

      {canWrite ? <RenameDialog fileName={itemName} id={item.id} onSubmit={handleRename} {...dialog("rename")} /> : null}
      {showShare && open === "share" ? <ShareFileDialog item={item} type={type} canManageAccess={showInternalAccess} canManageExternalShares={showExternalShares} {...dialog("share")} /> : null}
      {canMove && open === "move" ? <MoveFolderDialog id={item.id} itemName={itemName} type={type} source={item} {...dialog("move")} /> : null}
      {canWrite && !isFolder ? <MarkAsUsedDialog id={String(item.id)} itemName={itemName} isUsed={file.isUsed} currentNote={file.usedNote || ""} {...dialog("used")} /> : null}
      <DetailsDialog data={item} type={type} {...dialog("details")} />
      {canArchive ? <ArchiveDialog id={item.id} fileName={itemName} type={type} onArchive={handleArchive} {...dialog("archive")} /> : null}
    </>
  );
}

export default FileDropdownMenu;
