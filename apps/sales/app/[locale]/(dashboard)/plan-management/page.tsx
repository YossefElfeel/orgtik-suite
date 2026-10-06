"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Loader } from "lucide-react";
import SearchField from "@/components/shared/SearchField";
import { Filters } from "@/components/shared/Filters";
import DataTable from "@/components/shared/Table";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { PlanManagement } from "@/components/pages/plan-management/plan/PlanManagement";
import PlanManagementCard from "@/components/pages/plan-management/plan/PlanManagementCard";
import CustomerPlanCard from "@/components/pages/plan-management/plan/CustomerPlanCard";
import PlansGridSkeleton from "@/components/pages/plan-management/plan/PlansGridSkeleton";
import PlanFeaturesDialog from "@/components/dialogs/projects/PlanFeaturesDialog";
import type {
  PlanCardItem,
  PlanListItem,
  PlanPaymentMode,
  PlanStatus,
} from "@/types/plans";
import { usePlanColumns } from "./columns";
import { resolvePlanStatus } from "@/components/pages/plan-management/plan/PlanStatusCell";
import { Button } from "@/components/ui/button";
import MainHeader from "@/components/shared/MainHeader";
import { useRouter } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { useGetCategoriesListQuery } from "@/redux/features/categories/categoriesApi";
import { useGetDepartmentsListQuery } from "@/redux/features/departments/departmentsApi";
import { useGetDurationsQuery } from "@/redux/features/durations/durationsApi";
import { useGetPlansQuery } from "@/redux/features/plans/plansApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { displayCatalogText } from "@/types/localized";
import { pickDisplayData } from "@/lib/api-display";
import { useTranslations } from "next-intl";
import {
  getPlanPricingEntries,
  getPrimaryPlanPricing,
} from "@/lib/plan-pricing";
type ViewMode = "list" | "grid";

function parseAmount(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPlanCardItem(
  plan: PlanListItem,
  displayText: (value: Parameters<typeof displayCatalogText>[0]) => string,
): PlanCardItem {
  const pricing = getPrimaryPlanPricing(plan);
  return {
    id: plan.id,
    name: displayText(plan.name),
    categoryLabel: (plan.categories?.length
      ? plan.categories.map((category) => displayText(category.name)).join(", ")
      : displayText(plan.category.name)),
    department: displayText(plan.department.name),
    description: "",
    price: parseAmount(pricing?.discountedTotal),
    originalPrice: parseAmount(pricing?.undiscountedTotal),
    discountPercent: parseAmount(pricing?.discountPercentage),
    durationLabel: `${pricing?.duration.months ?? plan.minimumDurationMonths ?? 12}M`,
    region: displayText(plan.zones[0]?.name),
    badges: [],
    features: plan.features.map((feature) => displayText(feature.name)),
    featuresTotal: plan.featureCount,
    currencyCode: pricing?.currencyCode,
    currencySymbol: pricing?.currencySymbol,
  };
}

export default function PlansPage() {
  const router = useRouter();
  const { isCustomer, isReady } = useRole();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const [departmentId, setDepartmentId] = useState<string>();
  const [durationMonths, setDurationMonths] = useState<string>();
  const [status, setStatus] = useState<PlanStatus>();
  const [paymentMode, setPaymentMode] = useState<PlanPaymentMode>();
  const [priceRange, setPriceRange] = useState<string>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [featuresPlan, setFeaturesPlan] = useState<PlanCardItem | null>(null);

  const { isSalesman } = useRole();
  const searchQuery = search.trim() || undefined;
  const t = useTranslations("planManagement");
  const tCommon = useTranslations("common");
  const displayText = useCatalogDisplayText();
  
  const planColumns = usePlanColumns();

  const statusOptions = useMemo(
    () => [
      { id: "active", label: t("statusActive") },
      { id: "review", label: t("statusReview") },
      { id: "hidden", label: t("statusHidden") },
    ],
    [t],
  );

  const paymentModeOptions = useMemo(
    () => [
      { id: "cash_only", label: t("paymentCashOnly") },
      { id: "installment", label: t("paymentInstallment") },
    ],
    [t],
  );

  const priceOptions = useMemo(
    () => [
      { id: "under_200", label: t("priceUnder200") },
      { id: "200_400", label: t("price200To400") },
      { id: "over_400", label: t("priceOver400") },
    ],
    [t],
  );

  const { data: categoriesResponse } = useGetCategoriesListQuery({
    page: 1,
    limit: 100,
  });

  const { data: departmentsResponse } = useGetDepartmentsListQuery({
    page: 1,
    limit: 100,
  });

  const { data: durationsResponse } = useGetDurationsQuery(
    { page: 1, limit: 100, type: "plan" },
    { skip: !isCustomer },
  );

  const { data: plansResponse, isFetching } = useGetPlansQuery({
    page: currentPage,
    limit,
    search: searchQuery,
    q: searchQuery,
    categoryIds: categoryId ? [categoryId] : undefined,
    departmentIds: departmentId ? [departmentId] : undefined,
    paymentMode,
    isActive: isCustomer
      ? true
      : status === "active"
        ? true
        : status === "hidden"
          ? false
          : undefined,
  });

  const categoryOptions = useMemo(
    () =>
      (categoriesResponse?.data.items ?? []).map((category) => ({
        id: category.id,
        label: displayText(category.name),
      })),
    [categoriesResponse?.data.items, displayText],
  );

  const departmentOptions = useMemo(
    () =>
      (departmentsResponse?.data.items ?? []).map((department) => ({
        id: department.id,
        label: displayText(department.name),
      })),
    [departmentsResponse?.data.items, displayText],
  );

  const durationOptions = useMemo(() => {
    const seen = new Set<number>();
    return (durationsResponse?.data.items ?? [])
      .filter((duration) => duration.isActive)
      .filter((duration) => {
        if (seen.has(duration.months)) return false;
        seen.add(duration.months);
        return true;
      })
      .map((duration) => ({
        id: String(duration.months),
        label: duration.months === 1 ? t("oneMonth") : t("monthsCount", { count: duration.months }),
      }));
  }, [durationsResponse?.data.items, t]);

  const filteredPlans = useMemo(() => {
    const items = pickDisplayData(plansResponse)?.items ?? [];

    return items.filter((plan) => {
      if (
        !isCustomer &&
        status === "review" &&
        resolvePlanStatus(plan) !== "review"
      ) {
        return false;
      }

      if (durationMonths) {
        const months = Number(durationMonths);
        const hasDuration = getPlanPricingEntries(plan).some(
          (entry) => entry.duration.months === months,
        );
        if (!hasDuration) return false;
      }

      const price = parseAmount(getPrimaryPlanPricing(plan)?.discountedTotal);
      if (!isCustomer) {
        if (priceRange === "under_200" && price >= 200) return false;
        if (priceRange === "200_400" && (price < 200 || price > 400)) {
          return false;
        }
        if (priceRange === "over_400" && price <= 400) return false;
      }

      return true;
    });
  }, [
    durationMonths,
    isCustomer,
    plansResponse,
    priceRange,
    status,
  ]);

  const meta = pickDisplayData(plansResponse)?.meta ?? plansResponse?.data.meta;
  const totalPages = meta?.totalPages ?? 1;

  if (!isReady) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader className="size-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (isCustomer) {
    return (
      <section className="flex flex-col gap-6">
        <MainHeader
          title={t("title")}
          description={t("descriptionCustomer")}
        />

        <div className="space-y-6 rounded-xl border border-border/50 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchField
              search={{
                placeholder: t("searchCustomer"),
                setSearchValue: (value) => {
                  setSearch(value);
                  setCurrentPage(1);
                },
              }}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Filters
                options={categoryOptions}
                selectedId={categoryId}
                onSelectedChange={(id) => {
                  setCategoryId(id);
                  setCurrentPage(1);
                }}
                triggerLabel={tCommon("filterAll", { filter: t("columnCategory") })}
              />
              <Filters
                options={departmentOptions}
                selectedId={departmentId}
                onSelectedChange={(id) => {
                  setDepartmentId(id);
                  setCurrentPage(1);
                }}
                triggerLabel={tCommon("filterAll", { filter: t("columnDepartment") })}
              />
              <Filters
                options={durationOptions}
                selectedId={durationMonths}
                onSelectedChange={(id) => {
                  setDurationMonths(id);
                  setCurrentPage(1);
                }}
                triggerLabel={tCommon("filterAll", { filter: tCommon("duration") })}
              />
              <Filters
                options={paymentModeOptions}
                selectedId={paymentMode}
                onSelectedChange={(id) => {
                  setPaymentMode(id as PlanPaymentMode | undefined);
                  setCurrentPage(1);
                }}
                triggerLabel={tCommon("filterAll", { filter: tCommon("payment") })}
              />
            </div>
          </div>

          {isFetching && filteredPlans.length === 0 ? (
            <PlansGridSkeleton />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredPlans.map((plan) => (
                  <CustomerPlanCard
                    key={plan.id}
                    plan={plan}
                    onViewDetails={(selected) =>
                      router.push(`/plan-management/${selected.id}`)
                    }
                    onViewAllFeatures={(selected) =>
                      setFeaturesPlan(toPlanCardItem(selected, displayText))
                    }
                  />
                ))}
              </div>
              {filteredPlans.length === 0 ? (
                <p className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
                  {tCommon("noPlansFound")}
                </p>
              ) : (
                <CustomPagination
                  currentPage={meta?.page ?? currentPage}
                  totalPages={totalPages}
                  limit={meta?.limit ?? limit}
                  totalItems={meta?.total ?? filteredPlans.length}
                  onPageChange={setCurrentPage}
                  onLimitChange={(nextLimit) => {
                    setLimit(nextLimit);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          )}
        </div>

        <PlanFeaturesDialog
          plan={featuresPlan}
          open={Boolean(featuresPlan)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setFeaturesPlan(null);
          }}
        />
      </section>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-white p-5">
      <MainHeader
        smallTitle={t("title")}
        description={t("descriptionStaff")}
      >
        {!isSalesman && <PlanManagement />}
      </MainHeader>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchField
            search={{
              placeholder: t("searchStaff"),
              setSearchValue: (value) => {
                setSearch(value);
                setCurrentPage(1);
              },
            }}
          />
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="List view"
              onClick={() => setViewMode("list")}
            >
              <Icon icon="solar:list-linear" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
            >
              <Icon icon="solar:widget-2-linear" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filters
            options={categoryOptions}
            selectedId={categoryId}
            onSelectedChange={(id) => {
              setCategoryId(id);
              setCurrentPage(1);
            }}
            triggerLabel={tCommon("filterAll", { filter: t("columnCategory") })}
          />
          <Filters
            options={departmentOptions}
            selectedId={departmentId}
            onSelectedChange={(id) => {
              setDepartmentId(id);
              setCurrentPage(1);
            }}
            triggerLabel={tCommon("filterAll", { filter: t("columnDepartment") })}
          />
          <Filters
            options={statusOptions}
            selectedId={status}
            onSelectedChange={(id) => {
              setStatus(id as PlanStatus | undefined);
              setCurrentPage(1);
            }}
            triggerLabel={tCommon("filterAll", { filter: tCommon("status") })}
          />
          <Filters
            options={paymentModeOptions}
            selectedId={paymentMode}
            onSelectedChange={(id) => {
              setPaymentMode(id as PlanPaymentMode | undefined);
              setCurrentPage(1);
            }}
            triggerLabel={tCommon("filterAll", { filter: tCommon("payment") })}
          />
          <Filters
            options={priceOptions}
            selectedId={priceRange}
            onSelectedChange={(id) => {
              setPriceRange(id);
              setCurrentPage(1);
            }}
            triggerLabel={tCommon("filterAll", { filter: tCommon("price") })}
          />
        </div>
      </div>

      {isFetching && filteredPlans.length === 0 ? (
        viewMode === "grid" ? (
          <PlansGridSkeleton />
        ) : (
          <div className="flex min-h-48 items-center justify-center">
            <Loader className="size-6 animate-spin text-secondary" />
          </div>
        )
      ) : viewMode === "list" ? (
        <DataTable
          columns={planColumns}
          data={filteredPlans}
          pagination={{
            currentPage: meta?.page ?? currentPage,
            totalPages,
            limit: meta?.limit ?? limit,
            totalItems: meta?.total ?? filteredPlans.length,
            onPageChange: setCurrentPage,
            onLimitChange: (nextLimit) => {
              setLimit(nextLimit);
              setCurrentPage(1);
            },
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlans.map((plan) => (
              <PlanManagementCard
                key={plan.id}
                plan={plan}
                onViewDetails={(selected) =>
                  router.push(`/plan-management/${selected.id}`)
                }
              />
            ))}
          </div>
          {filteredPlans.length === 0 ? (
            <p className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
              {tCommon("noPlansFound")}
            </p>
          ) : (
            <CustomPagination
              currentPage={meta?.page ?? currentPage}
              totalPages={totalPages}
              limit={meta?.limit ?? limit}
              totalItems={meta?.total ?? filteredPlans.length}
              onPageChange={setCurrentPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
