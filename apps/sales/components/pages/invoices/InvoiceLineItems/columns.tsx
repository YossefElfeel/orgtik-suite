"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { InvoiceLineItem } from "@/types/invoices";
import { formatAmount } from "@/lib/format-amount";

function toAmountValue(amount: number | string) {
  return typeof amount === "number"
    ? amount
    : Number(String(amount).replace(/,/g, "")) || 0;
}

export function getInvoiceLineItemColumns(
  currency: string,
  t: (key: string) => string
): ColumnDef<InvoiceLineItem>[] {
  return [
    {
      accessorKey: "description",
      header: t("columnDescription"),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: t("columnQuantity"),
      cell: ({ row }) => (
        <span className="text-secondary">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: t("columnAmount"),
      cell: ({ row }) => (
        <span className="text-secondary">
          {formatAmount(row.original.amount, currency)}
        </span>
      ),
    },
    {
      id: "total",
      header: t("columnTotal"),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          {formatAmount(
            row.original.quantity * toAmountValue(row.original.amount),
            currency,
          )}
        </span>
      ),
    },
  ];
}
