"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import SearchField from "@/components/shared/SearchField";
import { Filters } from "@/components/shared/Filters";
import { CustomPagination } from "@/components/shared/CustomPagination";
import PillTabs from "@/components/shared/PillTabs";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/pages/plan-management/feature/FeatureCard";
import FeaturesGridSkeleton from "@/components/pages/plan-management/feature/FeaturesGridSkeleton";
import FeatureManagement from "@/components/dialogs/plan-management/FeatureManagement";
import { useGetCategoriesListQuery } from "@/redux/features/categories/categoriesApi";
import { useGetFeaturesQuery } from "@/redux/features/features/featuresApi";
import type { FeaturePaymentType } from "@/types/features";
import type { PillTabItem } from "@/types/tabs";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRole } from "@/hooks/useRole";
import { pickDisplayData } from "@/lib/api-display";
import { useTranslations } from "next-intl";

export default function FeaturesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [paymentType, setPaymentType] = useState<string>();
  const [isActiveFilter, setIsActiveFilter] = useState<string>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);


    const { isSalesman } = useRole();
    const t = useTranslations("planManagement.features");
    const tCommon = useTranslations("common");
    const displayText = useCatalogDisplayText();

  const searchQuery = search.trim() || undefined;

  const featurePaymentFilterOptions = useMemo(() => [
    { id: "full_payment", label: tCommon("fullPayment") },
    { id: "installment", label: tCommon("installment") },
  ], [tCommon]);

  const featureActiveFilterOptions = useMemo(() => [
    { id: "true", label: tCommon("active") },
    { id: "false", label: tCommon("inactive") },
  ], [tCommon]);

  const { data: categoriesResponse } = useGetCategoriesListQuery({
    page: 1,
    limit: 100,
  });

  const { data: featuresResponse, isFetching } = useGetFeaturesQuery({
    page: currentPage,
    limit,
    search: searchQuery,
    categoryId: categoryId !== "all" ? categoryId : undefined,
    paymentType: paymentType as FeaturePaymentType | undefined,
    isActive:
      isActiveFilter === "true"
        ? true
        : isActiveFilter === "false"
          ? false
          : undefined,
  });

  const categoryTabs: PillTabItem[] = useMemo(() => {
    const categories = categoriesResponse?.data.items ?? [];
    return [
      { id: "all", label: tCommon("all") },
      ...categories.map((category) => ({
        id: category.id,
        label: displayText(category.name),
      })),
    ];
  }, [categoriesResponse?.data.items, displayText, tCommon]);

  const features = pickDisplayData(featuresResponse)?.items ?? [];
  const meta =
    pickDisplayData(featuresResponse)?.meta ?? featuresResponse?.data.meta;

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-white p-5">
      <MainHeader
        smallTitle={t("title")}
        description={t("description")}
      >
        {!isSalesman && (
        <FeatureManagement
          trigger={
            <Button icon="solar:add-circle-linear">{t("newFeature")}</Button>
          }
        />
        )}
      </MainHeader>

      <PillTabs
        items={categoryTabs}
        value={categoryId}
        onValueChange={(id) => {
          setCategoryId(id);
          setCurrentPage(1);
        }}
        size="sm"
        equalWidth={false}
        ariaLabel={t("category")}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <SearchField
          search={{
            placeholder: t("searchPlaceholder"),
            setSearchValue: (value) => {
              setSearch(value);
              setCurrentPage(1);
            },
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Filters
            options={featurePaymentFilterOptions}
            selectedId={paymentType}
            onSelectedChange={(id) => {
              setPaymentType(id);
              setCurrentPage(1);
            }}
            triggerLabel={tCommon("filterAll", { filter: t("paymentType") })}
          />
          <Filters
            options={featureActiveFilterOptions}
            selectedId={isActiveFilter}
            onSelectedChange={(id) => {
              setIsActiveFilter(id);
              setCurrentPage(1);
            }}
            triggerLabel={tCommon("filterAll", { filter: tCommon("status") })}
          />
        </div>
      </div>

      {isFetching && features.length === 0 ? (
        <FeaturesGridSkeleton />
      ) : features.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          {t("noFeatures")}
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>

          <CustomPagination
            currentPage={meta?.page ?? currentPage}
            totalPages={meta?.totalPages ?? 1}
            limit={meta?.limit ?? limit}
            totalItems={meta?.total ?? 0}
            onPageChange={setCurrentPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
