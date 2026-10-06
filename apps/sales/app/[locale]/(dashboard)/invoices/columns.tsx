"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type {
  CustomInvoiceListItem,
  SalesInvoice,
  SubscriptionInvoice,
} from "@/types/invoices";
import InvoiceStatusCell from "@/components/pages/invoices/InvoiceStatusCell";
import InvoicePlanCell from "@/components/pages/invoices/InvoicePlanCell";
import InvoicePaymentTypeCell from "@/components/pages/invoices/InvoicePaymentTypeCell";
import InvoiceActions from "@/components/pages/invoices/InvoiceActions";
import CustomInvoiceActions from "@/components/pages/invoices/CustomInvoiceActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatShortDate } from "@/lib/format-date";
import { formatAmount } from "@/lib/format-amount";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function useCustomerInvoiceColumns(): ColumnDef<SubscriptionInvoice>[] {
  const t = useTranslations("invoices");

  return useMemo(
    () => [
      {
        accessorKey: "invoiceId",
        header: t("columnInvoiceId"),
        cell: ({ row }) => (
          <Link
            href={`/invoices/${row.original.invoiceId}`}
            className="font-semibold hover:text-primary hover:underline"
          >
            {row.original.invoiceId}
          </Link>
        ),
      },
      {
        accessorKey: "projectName",
        header: t("columnProjectName"),
      },
      {
        id: "plan",
        header: t("columnPlan"),
        cell: ({ row }) => (
          <InvoicePlanCell
            plan={row.original.plan}
            planTag={row.original.planTag}
          />
        ),
      },
      {
        id: "paymentType",
        header: t("columnPaymentType"),
        cell: ({ row }) =>
          row.original.paymentType ? (
            <InvoicePaymentTypeCell paymentType={row.original.paymentType} />
          ) : (
            <span className="text-secondary">—</span>
          ),
      },
      {
        id: "totalPrice",
        header: t("columnTotalPrice"),
        cell: ({ row }) =>
          formatAmount(row.original.totalPrice, getInvoiceCurrencyCode(row.original)),
      },
      {
        accessorKey: "createdAt",
        header: t("columnInvoiceDate"),
        cell: ({ row }) => formatShortDate(row.original.createdAt),
      },
      {
        accessorKey: "status",
        header: t("columnStatus"),
        cell: ({ row }) => <InvoiceStatusCell status={row.original.status} />,
      },
      {
        id: "actions",
        header: t("columnActions"),
        cell: ({ row }) => (
          <InvoiceActions invoiceId={row.original.invoiceId} />
        ),
      },
    ],
    [t],
  );
}

export function useSubscriptionInvoiceColumns(): ColumnDef<SubscriptionInvoice>[] {
  const t = useTranslations("invoices");

  return useMemo(
    () => [
      {
        accessorKey: "invoiceId",
        header: t("columnInvoiceId"),
        cell: ({ row }) => (
          <Link
            href={`/invoices/${row.original.invoiceId}`}
            className="font-semibold hover:text-primary hover:underline"
          >
            {row.original.invoiceId}
          </Link>
        ),
      },
      {
        accessorKey: "projectName",
        header: t("columnProjectName"),
      },
      {
        accessorKey: "plan",
        header: t("columnPlan"),
      },
      {
        accessorKey: "status",
        header: t("columnStatus"),
        cell: ({ row }) => <InvoiceStatusCell status={row.original.status} />,
      },
      {
        id: "priceVat",
        header: t("columnPriceVat"),
        cell: ({ row }) =>
          formatAmount(row.original.totalPrice, getInvoiceCurrencyCode(row.original)),
      },
      {
        accessorKey: "dueDate",
        header: t("columnDueDate"),
        cell: ({ row }) => formatShortDate(row.original.dueDate),
      },
      {
        accessorKey: "createdAt",
        header: t("columnIssueDate"),
        cell: ({ row }) => formatShortDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: t("columnActions"),
        cell: ({ row }) => (
          <InvoiceActions invoiceId={row.original.invoiceId} />
        ),
      },
    ],
    [t],
  );
}

export function useSalesInvoiceColumns(): ColumnDef<SalesInvoice>[] {
  const t = useTranslations("invoices");

  return useMemo(
    () => [
      {
        accessorKey: "invoiceId",
        header: t("columnInvoiceId"),
        cell: ({ row }) => (
          <Link
            href={`/invoices/${row.original.invoiceId}`}
            className="font-semibold hover:text-primary hover:underline"
          >
            {row.original.invoiceId}
          </Link>
        ),
      },
      {
        id: "salesman",
        header: t("columnSalesMan"),
        cell: ({ row }) => {
          const { salesmanName, salesmanAvatarUrl } = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <Avatar size="sm">
                {salesmanAvatarUrl ? (
                  <AvatarImage src={salesmanAvatarUrl} alt={salesmanName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(salesmanName)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{salesmanName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("columnStatus"),
        cell: ({ row }) => <InvoiceStatusCell status={row.original.status} />,
      },
      {
        id: "totalPrice",
        header: t("columnTotalPrice"),
        cell: ({ row }) =>
          formatAmount(row.original.totalPrice, getInvoiceCurrencyCode(row.original)),
      },
      {
        accessorKey: "projectName",
        header: t("columnProjectName"),
      },
      {
        accessorKey: "dueDate",
        header: t("columnDueDate"),
        cell: ({ row }) => formatShortDate(row.original.dueDate),
      },
      {
        accessorKey: "createdAt",
        header: t("columnIssueDate"),
        cell: ({ row }) => formatShortDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: t("columnActions"),
        cell: ({ row }) => (
          <InvoiceActions invoiceId={row.original.invoiceId} />
        ),
      },
    ],
    [t],
  );
}

export function useCustomInvoiceColumns(): ColumnDef<CustomInvoiceListItem>[] {
  const t = useTranslations("invoices");

  return useMemo(
    () => [
      {
        accessorKey: "invoiceId",
        header: t("columnInvoiceId"),
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.invoiceNumber ?? row.original.invoiceId}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: t("columnBillTo"),
        cell: ({ row }) =>
          row.original.customerName ??
          row.original.clientName ??
          row.original.billingName ??
          "—",
      },
      {
        accessorKey: "status",
        header: t("columnStatus"),
        cell: ({ row }) => <InvoiceStatusCell status={row.original.status} />,
      },
      {
        id: "amount",
        header: t("columnAmount"),
        cell: ({ row }) =>
          formatAmount(
            row.original.totalAmount ??
              row.original.totalPrice ??
              row.original.amount ??
              0,
            getInvoiceCurrencyCode(row.original),
          ),
      },
      {
        accessorKey: "dueDate",
        header: t("columnDueDate"),
        cell: ({ row }) =>
          row.original.dueDate ? formatShortDate(row.original.dueDate) : "—",
      },
      {
        accessorKey: "issuedAt",
        header: t("columnIssueDate"),
        cell: ({ row }) =>
          formatShortDate(row.original.issuedAt ?? row.original.createdAt),
      },
      {
        id: "actions",
        header: t("columnActions"),
        cell: ({ row }) => <CustomInvoiceActions invoice={row.original} />,
      },
    ],
    [t],
  );
}
