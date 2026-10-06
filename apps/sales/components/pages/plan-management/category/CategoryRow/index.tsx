"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import CategoryManagement from "@/components/dialogs/plan-management/CategoryManagement";
import { Link } from "@/i18n/routing";
import { formatCategoryPlansLabel } from "@/lib/categories";
import { useDeleteCategoryMutation } from "@/redux/features/categories/categoriesApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRole } from "@/hooks/useRole";
import type { GroupedCategoryItem } from "@/types/categories";

type Props = {
  category: GroupedCategoryItem;
  departmentId: string;
};

export default function CategoryRow({ category, departmentId }: Props) {
  const { isSalesman } = useRole();
  const displayText = useCatalogDisplayText();
  const [deleteCategory, { isLoading }] = useDeleteCategoryMutation();
  const plansLabel = formatCategoryPlansLabel(category.planCount);
  const categoryName = displayText(category.name);

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-16 font-semibold text-foreground">
            {categoryName}
          </h4>
          <div className="rounded-full bg-muted px-2.5 py-0.5 text-12 font-medium text-secondary">
            {plansLabel}
          </div>
        </div>
        <p className="line-clamp-2 text-14 text-secondary">
          {displayText(category.description)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost-primary"
          size="icon-sm"
          aria-label={`View ${categoryName}`}
          nativeButton={false}
          className="hover:text-white!"
          render={<Link href={`/plan-management/categories/${category.id}`} />}
          icon="solar:eye-linear"
        />
        {!isSalesman && (
          <>
            <CategoryManagement
              id={category.id}
              departmentId={departmentId}
              trigger={
                <Button
                  type="button"
                  variant="ghost-edit"
                  size="icon-sm"
                  aria-label={`Edit ${categoryName}`}
                  icon="solar:pen-linear"
                />
              }
            />
            <DeleteDialog
              title={`category ${categoryName}`}
              isLoading={isLoading}
              onConfirm={() => {
                void deleteCategory(category.id).unwrap();
              }}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete ${categoryName}`}
                  disabled={isLoading}
                  icon="solar:trash-bin-trash-linear"
                />
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
