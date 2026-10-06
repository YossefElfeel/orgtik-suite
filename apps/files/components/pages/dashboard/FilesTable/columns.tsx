"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { Badge, useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { IFile } from "@/types";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";

export type FileRow = IFile;

export type Member = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
};

/* The file list's columns, translated, with sizes and dates in the reader's language. */
export function useFileColumns({ actions, onPreview }: { actions: (file: IFile) => ReactNode; onPreview: (file: IFile) => void }) {
  const t = useTranslations("Files");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const f = useFormatter();

  return useMemo<ColumnDef<IFile, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("name"),
        enableSorting: false,
        meta: { truncate: true },
        cell: ({ row }) => {
          const file = row.original;
          const extension = file.name.split(".").pop()?.toLowerCase() || "";
          const isImage = file.mimeType?.startsWith("image/");
          const name = file.displayName || file.name;
          return (
            <span className="inline-flex max-w-full items-center gap-3">
              <FileTypeIcon name={file.name} mimeType={file.mimeType} />
              <span className="flex min-w-0 flex-col">
                {isImage ? (
                  <button
                    type="button"
                    onClick={() => onPreview(file)}
                    dir="auto"
                    className="truncate text-start font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    {name}
                  </button>
                ) : (
                  <span dir="auto" className="truncate font-semibold text-fg">
                    {name}
                  </span>
                )}
                <span dir="ltr" className="text-start text-micro uppercase text-fg-subtle">
                  {extension}
                </span>
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "size",
        header: t("size"),
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ getValue }) => <span className="text-fg-muted">{f.bytes(Number(getValue()))}</span>,
      },
      {
        accessorKey: "folderId",
        header: t("folder"),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.folder ? (
            <Link href={`/my-files/${row.original.folderId}`} dir="auto" className="text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {row.original.folder.name}
            </Link>
          ) : (
            <span className="text-fg-muted">{tc("root")}</span>
          ),
      },
      {
        accessorKey: "isUsed",
        header: t("status"),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.isUsed ? (
            <Badge tone="success" size="sm" icon={<CheckCircle weight="bold" />}>
              {t("inUse")}
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm" icon={<Circle weight="bold" />}>
              {t("notInUse")}
            </Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: t("added"),
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ getValue }) => <span className="text-fg-muted">{f.date(getValue<string>())}</span>,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        enableSorting: false,
        meta: { width: "1%" },
        cell: ({ row }) => actions(row.original),
      },
    ],
    [t, tc, f, locale, actions, onPreview],
  );
}
