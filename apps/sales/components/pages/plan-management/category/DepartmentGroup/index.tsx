"use client";

import { Icon } from "@iconify/react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import CategoryManagement from "@/components/dialogs/plan-management/CategoryManagement";
import DepartmentGroupCategories from "@/components/pages/plan-management/category/DepartmentGroupCategories";
import DepartmentActions from "@/components/pages/plan-management/department/DepartmentActions";
import { formatDepartmentCategoriesLabel } from "@/lib/categories";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRole } from "@/hooks/useRole";
import type { DepartmentGroupHeader } from "@/types/categories";
import { useTranslations } from "next-intl";

type Props = {
  department: DepartmentGroupHeader;
  isExpanded: boolean;
  search?: string;
};

export default function DepartmentGroup({
  department,
  isExpanded,
  search,
}: Props) {
  const { isSalesman } = useRole();
  const displayText = useCatalogDisplayText();
  const tCat = useTranslations("planManagement.categories");
  const tCommon = useTranslations("common");

  return (
    <AccordionItem
      value={department.departmentId}
      className="overflow-hidden rounded-xl border border-border bg-white p-0 shadow-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
        <AccordionTrigger className="min-w-0 flex-1 gap-3 py-0 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-2 text-start sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Icon
                icon="solar:alt-arrow-down-linear"
                className="size-4.5 shrink-0 text-secondary transition-transform group-aria-expanded/accordion-trigger:rotate-180"
              />
              <p className="truncate text-18 font-semibold text-foreground">
                {displayText(department.departmentName)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-14 text-secondary">
                <Icon icon="solar:user-linear" className="size-4 shrink-0" />
                {tCommon("manager")}: {department.managerName || tCommon("unassigned")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-12 font-medium text-secondary">
                {tCommon("categoriesCount", { count: department.categoryCount })}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <div className="flex shrink-0 items-center gap-2">
          {!isSalesman && (
        <>
            <CategoryManagement
              departmentId={department.departmentId}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon="solar:add-circle-linear"
                >
                  {tCat("addCategory")}
                </Button>
              }
            />
          
          <DepartmentActions
            id={department.departmentId}
            name={department.departmentName}
          />
        </>
          )}
        </div>
      </div>

      <AccordionContent className="pb-0 mx-4">
        <DepartmentGroupCategories
          departmentId={department.departmentId}
          search={search}
          isExpanded={isExpanded}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
