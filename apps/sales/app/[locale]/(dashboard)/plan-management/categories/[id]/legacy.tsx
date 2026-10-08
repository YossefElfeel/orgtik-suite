"use client";
import { useTranslations } from "next-intl";

import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import MainHeader from "@/components/shared/MainHeader";
import CategoryDetails from "@/components/pages/plan-management/category/CategoryDetails";
import { useGetCategoryQuery } from "@/redux/features/categories/categoriesApi";
import { pickDisplayData } from "@/lib/api-display";
import type { CategoryDetail } from "@/types/categories";

export default function CategoryDetailsPage() {
  const t = useTranslations("planManagement");
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetCategoryQuery(id, { skip: !id });
  const category: CategoryDetail | undefined = pickDisplayData(data);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader className="size-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (isError || !category) {
    return (
      <section className="flex flex-col gap-6">
        <MainHeader
          title={t("categoryUnavailable")}
          description={t("categoryUnavailableDesc")}
          backLink={{
            href: "/plan-management/categories",
            label: "Back to Categories",
          }}
        />
      </section>
    );
  }

  return <CategoryDetails category={category} />;
}
