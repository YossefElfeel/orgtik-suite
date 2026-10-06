"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CalendarBlank, File, FileText, Folder, HardDrives, UserCircle } from "@phosphor-icons/react";
import { useFormatter } from "@orgtik/ui";
import { BaseDialog } from "../BaseDialog";
import { IFile, IFolder, IFolderPinned } from "@/types";

interface DetailsDialogProps {
  data: IFile | IFolder | IFolderPinned;
  type: "file" | "folder";
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DetailsDialog({ data, type, children, open, onOpenChange }: DetailsDialogProps) {
  const t = useTranslations("Dialogs");
  const f = useFormatter();
  const isFolder = type === "folder";
  const folder = data as IFolder;
  const file = data as IFile;
  const name = isFolder ? folder.name : file.displayName || file.name;
  const size = !isFolder && typeof file.size === "number" ? f.bytes(file.size) : null;
  const owner = isFolder ? (folder as { owner?: { firstName?: string } }).owner?.firstName : (file.folder as { owner?: { firstName?: string } } | undefined)?.owner?.firstName;
  const rows: { label: string; value: React.ReactNode; icon: React.ReactNode }[] = [
    { label: t("details.type"), value: isFolder ? t("details.folder") : file.mimeType || t("details.file"), icon: <FileText /> },
    ...(isFolder ? [] : [{ label: t("details.size"), value: size ?? t("details.unknown"), icon: <HardDrives /> }]),
    { label: t("details.created"), value: data.createdAt ? f.date(data.createdAt, { dateStyle: "medium" }) : t("details.unknown"), icon: <CalendarBlank /> },
    ...(owner ? [{ label: t("details.owner"), value: <bdi>{owner}</bdi>, icon: <UserCircle /> }] : []),
  ];

  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-field bg-sunken p-4">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-field bg-raised text-fg-brand [&>svg]:size-7">
          {isFolder ? <Folder weight="duotone" /> : <File weight="duotone" />}
        </span>
        <span dir="auto" className="min-w-0 truncate font-display text-title-sm text-fg">
          {name}
        </span>
      </div>
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-body-sm text-fg-muted [&>svg]:size-4">
              <span aria-hidden="true">{r.icon}</span>
              {r.label}
            </dt>
            <dd className="min-w-0 truncate text-body-sm font-medium text-fg">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <BaseDialog title={t("details.title")} size="md" content={content} cancelText={t("close")} open={open} onOpenChange={onOpenChange}>
      {children}
    </BaseDialog>
  );
}
