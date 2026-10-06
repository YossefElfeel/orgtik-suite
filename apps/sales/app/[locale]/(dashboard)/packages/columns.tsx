"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import { toast } from "sonner";
import PackageManagement from "@/components/dialogs/packages/PackageManagement";
import { Link } from "@/i18n/routing";
import type { PackageItem } from "@/types/packages";
import { formatPackagePlansLabel } from "@/lib/packages";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useDeletePackageMutation } from "@/redux/features/packages/packagesApi";
import CurrencyAmount from "@/components/shared/CurrencyAmount";

function PackageActions({ pkg }: { pkg: PackageItem }) {
  const { isAdmin, isManager, isSalesman } = useRole();
  const displayText = useCatalogDisplayText();
  const [deletePackage, { isLoading: isDeleting }] = useDeletePackageMutation();
  const tCommon = useTranslations("common");

  const canDelete = isAdmin && !isManager;

  return (
    <div className="flex items-center gap-1.5">
      <Link href={`/packages/${pkg.id}`}>
        <Button
          type="button"
          variant="ghost-primary"
          size="icon-sm"
          aria-label={tCommon("viewDetails")}
          icon="solar:eye-linear"
        />
      </Link>
      {!isSalesman && (
        <PackageManagement
          id={pkg.id}
          trigger={
            <Button
              type="button"
              variant="ghost-edit"
              size="icon-sm"
              aria-label={tCommon("editDetails")}
              icon="solar:pen-linear"
            />
          }
        />
      )}
      {canDelete && (
        <DeleteDialog
          title={displayText(pkg.name)}
          onConfirm={async () => {
            try {
              await deletePackage(pkg.id).unwrap();
            } catch (err) {
              // baseApi interceptor handles the error toast
            }
          }}
          isLoading={isDeleting}
          trigger={
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={tCommon("delete")}
              icon="solar:trash-bin-trash-linear"
            />
          }
        />
      )}
    </div>
  );
}

export function usePackageColumns(): ColumnDef<PackageItem>[] {
  const t = useTranslations("packages");
  const displayText = useCatalogDisplayText();

  return useMemo(() => [
    {
      accessorKey: "name",
      header: t("columnPackageName"),
      cell: ({ row }) => (
        <Link
          href={`/packages/${row.original.id}`}
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          {displayText(row.original.name)}
        </Link>
      ),
    },
    {
      accessorKey: "description",
      header: t("columnDescription"),
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-xs text-secondary">
          {displayText(row.original.description)}
        </span>
      ),
    },
    {
      id: "plan",
      header: t("columnPlan"),
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-xs text-secondary">
          {formatPackagePlansLabel(row.original.planNames, displayText)}
        </span>
      ),
    },
    {
      id: "price",
      header: t("columnPrice"),
      cell: ({ row }) => {
        const firstPrice = row.original.prices?.[0];
        if (!firstPrice) return <span className="text-muted-foreground">-</span>;
        
        return (
          <span className="font-medium text-foreground">
            <CurrencyAmount
              amount={firstPrice.amount}
              currency={firstPrice.currencyCode}
            />
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("columnActions"),
      cell: ({ row }) => <PackageActions pkg={row.original} />,
    },
  ], [displayText, t]);
}
