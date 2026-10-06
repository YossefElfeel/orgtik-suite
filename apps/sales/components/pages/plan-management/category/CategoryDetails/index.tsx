"use client";

import type { CategoryDetail } from "@/types/categories";
import MainHeader from "@/components/shared/MainHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import CategoryManagement from "@/components/dialogs/plan-management/CategoryManagement";
import { Button } from "@/components/ui/button";
import CategoryStats from "@/components/pages/plan-management/category/CategoryStats";
import CategoryZones from "@/components/pages/plan-management/category/CategoryZones";
import CategoryPlans from "@/components/pages/plan-management/category/CategoryPlans";
import CategoryFeatures from "@/components/pages/plan-management/category/CategoryFeatures";
import { useRouter } from "@/i18n/routing";
import { getCategoryManagerName } from "@/lib/categories";
import { useDeleteCategoryMutation } from "@/redux/features/categories/categoriesApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTranslations } from "next-intl";

type Props = {
  category: CategoryDetail;
};

function DeleteCategoryButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [deleteCategory, { isLoading }] = useDeleteCategoryMutation();
  const tCat = useTranslations("planManagement.categories");

  return (
    <DeleteDialog
      title={tCat("deleteCategory", { name })}
      isLoading={isLoading}
      onConfirm={() => {
        void deleteCategory(id)
          .unwrap()
          .then(() => {
            router.push("/plan-management/categories");
          });
      }}
      trigger={
        <Button
          variant="outline"
          type="button"
          className="border-red/20 text-red hover:bg-red/5 hover:text-red"
          icon="solar:trash-bin-trash-linear"
        >
          {tCat("deleteCategoryAction")}
        </Button>
      }
    />
  );
}

export default function CategoryDetails({ category }: Props) {
  const displayText = useCatalogDisplayText();
  const tCat = useTranslations("planManagement.categories");
  const categoryName = displayText(category.name);
  const departmentName = displayText(category.departmentName);

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={categoryName}
        backLink={{
          href: "/plan-management/categories",
          label: tCat("backToCategories"),
        }}
        subChildren={
          <div className="mt-1 flex flex-wrap items-center gap-2 text-14 text-secondary">
            <span>{departmentName}</span>
            <span aria-hidden>•</span>
            <span>
              {getCategoryManagerName(category.departmentManagerName)}
            </span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <DeleteCategoryButton id={category.id} name={categoryName} />
          <CategoryManagement
            id={category.id}
            departmentId={category.departmentId}
            trigger={
              <Button type="button" icon="solar:pen-linear">
                {tCat("editCategory")}
              </Button>
            }
          />
        </div>
      </MainHeader>

      <CategoryStats category={category} />

      <SectionCard title={tCat("categoryDescription")}>
        <p className="text-14 leading-6 text-secondary">
          {displayText(category.description)}
        </p>
      </SectionCard>

      <CategoryZones zones={category.zones ?? []} />
      <CategoryPlans plans={category.plans ?? []} />
      <CategoryFeatures features={category.features ?? []} />
    </section>
  );
}
