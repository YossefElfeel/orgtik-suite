"use client";
import { useTranslations } from "next-intl";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Filters } from "@/components/shared/Filters";
import SearchField from "@/components/shared/SearchField";
export type PackagePlanOption = {
  id: string;
  name: string;
  category: string;
  featureCount: number;
};

type Props = {
  plans: PackagePlanOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
};

export default function PackagePlansPicker({
  plans,
  selectedIds,
  onChange,
  error,
}: Props) {
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>();

  const categoryOptions = useMemo(() => {
    const unique = [...new Set(plans.map((plan) => plan.category))];
    return unique.map((category) => ({ id: category, label: category }));
  }, [plans]);

  const selectedCategoryCount = useMemo(() => {
    const categories = new Set(
      plans
        .filter((plan) => selectedIds.includes(plan.id))
        .map((plan) => plan.category),
    );
    return categories.size;
  }, [plans, selectedIds]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesCategory = !categoryId || plan.category === categoryId;
      const matchesSearch =
        !query ||
        plan.name.toLowerCase().includes(query) ||
        plan.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [plans, search, categoryId]);

  const groupedPlans = useMemo(() => {
    const groups = new Map<string, PackagePlanOption[]>();
    for (const plan of filteredPlans) {
      const current = groups.get(plan.category) ?? [];
      current.push(plan);
      groups.set(plan.category, current);
    }
    return [...groups.entries()];
  }, [filteredPlans]);

  const togglePlan = (planId: string) => {
    if (selectedIds.includes(planId)) {
      onChange(selectedIds.filter((id) => id !== planId));
      return;
    }
    onChange([...selectedIds, planId]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {tCommon("plansInBundle")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} {tCommon("selected")} 
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-0 flex-1 [&>div]:max-w-none">
          <SearchField
            search={{
              placeholder: "Search for Plan...",
              setSearchValue: setSearch,
              debounceMs: 300,
            }}
          />
        </div>
        <Filters
          options={categoryOptions}
          selectedId={categoryId}
          onSelectedChange={setCategoryId}
          triggerLabel="Categories: All"
        />
      </div>

      <div className={cn(" space-y-4 ", error && "border-destructive")}>
        {groupedPlans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {tCommon("noPlansFound")}
          </p>
        ) : (
          groupedPlans.map(([category, categoryPlans]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {category} ({categoryPlans.length})
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>
              <ul className="space-y-3">
                {categoryPlans.map((plan) => {
                  const checked = selectedIds.includes(plan.id);

                  return (
                    <li key={plan.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-4 bg-white px-4 py-3.5 transition-colors rounded-xl border border-border shadow-sm",
                          checked && "bg-primary/5 border-primary/20",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePlan(plan.id)}
                          className="size-5 rounded-[4px]"
                        />
                        <span
                          className={cn(
                            "min-w-0 flex-1 text-[15px] font-semibold",
                            checked ? "text-primary" : "text-foreground",
                          )}
                        >
                          {plan.name}
                        </span>
                        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground bg-white">
                          {plan.featureCount} {tCommon("features")}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <p className="text-12 leading-5 text-muted-foreground">
        {tCommon("selectPlansInBundle")}
      </p>

      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <Icon icon="solar:danger-circle-linear" className="size-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
