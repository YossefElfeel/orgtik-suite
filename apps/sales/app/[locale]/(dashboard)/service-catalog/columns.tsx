import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@orgtik/ui";
import { serviceLabel } from "@/lib/service-catalog";
import type { ServiceOffer } from "@/types/service-catalog";
export function catalogColumns(t: (key: string) => string, locale: string, money: (amount: number) => string, canEdit: boolean, edit: (id: string) => void): ColumnDef<ServiceOffer>[] { return [
  { accessorKey: "name", header: t("name"), cell: ({ row }) => <span dir="auto" className="font-medium">{serviceLabel(row.original.draft?.name || row.original.name, locale)}</span>, meta: { wrap: true } },
  { id: "department", header: t("department"), cell: ({ row }) => t(`departments.${row.original.draft?.department || row.original.department || row.original.id.split("/")[0]}`) },
  { accessorKey: "monthlyCHF", header: t("monthlyCHF"), cell: ({ row }) => <div className="flex flex-col gap-1"><span>{money(row.original.monthlyCHF)}</span>{row.original.draft?.monthlyCHF !== undefined ? <span className="text-caption text-fg-muted">{t("draft")} · {money(row.original.draft.monthlyCHF)}</span> : null}</div>, meta: { numeric: true } },
  { id: "draft", header: t("publication"), cell: ({ row }) => <Badge tone={row.original.draft ? "warning" : "success"}>{t(row.original.draft ? "draft" : "published")}</Badge> },
  { id: "actions", header: t("actions"), cell: ({ row }) => canEdit ? <Button variant="secondary" size="xs" shape="control" onClick={() => edit(row.original.id)} aria-label={`${t("editOffer")} · ${serviceLabel(row.original.name, locale)}`}>{t("edit")}</Button> : <span className="text-caption text-fg-subtle">{t("readOnly")}</span> }
]; }
