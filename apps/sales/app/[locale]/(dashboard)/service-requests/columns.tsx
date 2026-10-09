import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@orgtik/ui";
import type { ServiceRequest } from "@/types/service-catalog";
export function requestColumns(t: (key: string) => string, select: (id: string) => void): ColumnDef<ServiceRequest>[] { return [
  { accessorKey: "number", header: t("reference"), cell: ({ row }) => <bdi dir="ltr">{row.original.number}</bdi> },
  { accessorKey: "title", header: t("request"), meta: { wrap: true }, cell: ({ row }) => <Button variant="ghost" size="xs" shape="control" className="max-w-full text-start whitespace-normal" onClick={() => select(row.original.id)}><span dir="auto">{row.original.title}</span></Button> },
  { accessorKey: "workspaceName", header: t("workspace"), meta: { wrap: true }, cell: ({ row }) => <span dir="auto">{row.original.workspaceName}</span> },
  { accessorKey: "state", header: t("status"), cell: ({ row }) => <Badge tone={row.original.state === "completed" ? "success" : row.original.state === "on_hold" ? "warning" : "neutral"}>{t(`states.${row.original.state}`)}</Badge> },
  { accessorKey: "assignee", header: t("assignee"), cell: ({ row }) => <span dir="auto">{row.original.assignee || t("unassigned")}</span> }
]; }
