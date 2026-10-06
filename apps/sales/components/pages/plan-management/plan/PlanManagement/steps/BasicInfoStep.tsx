"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import SwitchFormEle from "@/components/ui/form/switch-form-element";
import LocalizedDescriptionFields from "@/components/ui/form/LocalizedDescriptionFields";
import LocalizedNameFields from "@/components/ui/form/LocalizedNameFields";
import type { PlanFormValues } from "@/schemas/plans";
import { useGetCategoriesListQuery } from "@/redux/features/categories/categoriesApi";
import { useGetDepartmentsListQuery } from "@/redux/features/departments/departmentsApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTranslations } from "next-intl";

type Props = {
  form: UseFormReturn<PlanFormValues>;
  enabled?: boolean;
};

export function BasicInfoStep({ form, enabled = true }: Props) {
  const tCommon = useTranslations("common");
  const displayText = useCatalogDisplayText();
  const departmentId = form.watch("department");

  const { data: categoriesResponse } = useGetCategoriesListQuery(
    {
      page: 1,
      limit: 100,
      departmentId: departmentId || undefined,
    },
    { skip: !enabled || !departmentId },
  );
  const { data: departmentsResponse } = useGetDepartmentsListQuery(
    { page: 1, limit: 100 },
    { skip: !enabled },
  );

  const categoryOptions = (categoriesResponse?.data.items ?? []).map(
    (category) => ({
      value: category.id,
      label: displayText(category.name),
    }),
  );

  const departmentOptions = (departmentsResponse?.data.items ?? []).map(
    (department) => ({
      value: department.id,
      label: displayText(department.name),
    }),
  );

  const t = useTranslations("planManagement.form");

  useEffect(() => {
    const subscription = form.watch((_values, info) => {
      if (info.name !== "department" || info.type !== "change") {
        return;
      }

      form.setValue("categories", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("featureIds", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{t("basicInfo")}</p>

      <LocalizedNameFields
        form={form}
        name="name"
        label={t("name")}
        placeholder={t("namePlaceholder")}
      />

      <LocalizedDescriptionFields
        form={form}
        name="description"
        label={t("description")}
        placeholder={t("descriptionPlaceholder")}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ComboboxFormEle
          form={form}
          name="department"
          label={t("department")}
          placeholder={t("selectDepartment")}
          options={departmentOptions}
        />
        <ComboboxFormEle
          form={form}
          name="categories"
          label={t("categories")}
          placeholder={
            departmentId ? t("selectCategories") : t("selectDepartmentFirst")
          }
          options={categoryOptions}
          multiple
          disabled={!departmentId}
          emptyMessage={
            departmentId
              ? t("noCategoriesForDepartment")
              : t("selectDepartmentFirst")
          }
        />
      </div>

      <SwitchFormEle
        form={form}
        name="isActive"
        label={t("isActive")}
        ariaLabel={tCommon("toggleActivePlan")}
        className="items-center rounded-lg py-3"
      />
    </div>
  );
}
