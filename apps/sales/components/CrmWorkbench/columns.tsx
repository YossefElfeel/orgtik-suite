import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@orgtik/ui";
import type { CrmBootstrap, CrmContact } from "@/types/crm-v3";
import { crmLabel } from "@/lib/crm-v3";
export function crmColumns(
  t: (key: string) => string,
  locale: string,
  data: CrmBootstrap,
  money: (value: number, currency: string) => string,
  open: (id: string) => void,
): ColumnDef<CrmContact>[] {
  return [
    {
      id: "contact",
      header: t("fullName"),
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="xs"
          shape="control"
          className="max-w-full text-start whitespace-normal"
          onClick={() => open(row.original.id)}
        >
          <span dir="auto">{row.original.fullName}</span>
        </Button>
      ),
      meta: { wrap: true },
    },
    {
      accessorKey: "companyName",
      header: t("company"),
      cell: ({ row }) => (
        <span dir="auto">{row.original.companyName || t("notSet")}</span>
      ),
      meta: { wrap: true },
    },
    {
      id: "stage",
      header: t("stage"),
      cell: ({ row }) => (
        <Badge>
          {crmLabel(
            data.pipelines
              .find((item) => item.id === row.original.pipelineId)
              ?.stages.find((item) => item.id === row.original.stageId)?.name,
            locale,
          )}
        </Badge>
      ),
    },
    {
      accessorKey: "salesName",
      header: t("owner"),
      cell: ({ row }) => (
        <span dir="auto">{row.original.salesName || t("notSet")}</span>
      ),
    },
    {
      accessorKey: "value",
      header: t("forecastValue"),
      cell: ({ row }) => money(row.original.value, row.original.currency),
      meta: { numeric: true },
    },
    {
      id: "probability",
      header: t("probability"),
      cell: ({ row }) =>
        new Intl.NumberFormat(locale, { style: "percent" }).format(
          row.original.probability / 100,
        ),
      meta: { numeric: true },
    },
    { accessorKey: "source", header: t("source") },
    {
      id: "tags",
      header: t("tags"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      ),
    },
  ];
}
