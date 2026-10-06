"use client";

// The labels table's columns. The row number continues across pages (MKT-063: page 2 started at 1
// again), and the row's actions are a named menu with a delete that asks first.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import { ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { LabelFormDialog } from "@/components/pages/labels/LabelFormDialog";
import { LabelTag } from "@/components/pages/posts/shared/LabelTag";
import { isolate } from "@/lib/bidi";
import { useDeleteLabelMutation } from "@/redux/features/labels/labelsApi";
import type { ILabel } from "@/types/label";

function LabelActions({ label }: { label: ILabel }) {
  const t = useTranslations("Labels");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [remove] = useDeleteLabelMutation();
  return (
    <>
      <Menu>
        <MenuTrigger render={<IconButton size="sm" variant="ghost" label={t("actionsFor", { name: isolate(label.name) })} icon={<DotsThreeVertical weight="bold" />} />} />
        <MenuContent align="end">
          <MenuItem icon={<PencilSimple />} onClick={() => setEditing(true)}>
            {t("edit")}
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(true)}>
            {t("delete")}
          </MenuItem>
        </MenuContent>
      </Menu>
      <LabelFormDialog label={label} open={editing} onOpenChange={setEditing} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteTitle", { name: isolate(label.name) })}
        impact={t("deleteImpact")}
        irreversible
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("keep")}
        onConfirm={() => remove(label.id).unwrap()}
      />
    </>
  );
}

export function useLabelColumns({ offset, canManage }: { offset: number; canManage: boolean }): ColumnDef<ILabel>[] {
  const t = useTranslations("Labels");
  const f = useFormatter();
  return useMemo<ColumnDef<ILabel>[]>(
    () => [
      { id: "n", header: () => <span aria-label={t("colNumber")}>#</span>, meta: { numeric: true, width: "1%" }, cell: ({ row }) => offset + row.index + 1 },
      { id: "label", header: t("colLabel"), cell: ({ row }) => <LabelTag name={row.original.name} color={row.original.color} /> },
      {
        id: "created",
        header: t("colCreated"),
        meta: { numeric: true },
        cell: ({ row }) => (row.original.createdAt ? f.date(row.original.createdAt, { dateStyle: "medium" }) : ""),
      },
      ...(canManage ? [{ id: "actions", header: () => <span className="sr-only">{t("colActions")}</span>, meta: { width: "1%" }, cell: ({ row }) => <LabelActions label={row.original} /> } as ColumnDef<ILabel>] : []),
    ],
    [t, f, offset, canManage],
  );
}
