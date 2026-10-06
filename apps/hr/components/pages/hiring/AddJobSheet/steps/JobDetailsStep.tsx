"use client";
import { CalendarDots as CalendarDays } from "@phosphor-icons/react";

import * as React from "react";

import SelectFormEle from "@/components/ui/form/select-form-element";
import { SwitchFormElement } from "@/components/ui/form/switch-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import { useGetDepartmentsOptionsQuery } from "@/redux/features/department/departmentApi";

import {
  EXPERIENCE_LEVELS,
  JOB_MODES,
  JOB_TYPES,
  REQUIRED_EXPERIENCE_OPTIONS,
  REQUIRED_EXPERIENCE_YEARS,
} from "../constants";
import type { AddJobStepContentProps } from "../types";
import { useTranslations } from "next-intl";

const selectClassName =
  "h-10 w-full rounded-lg border-border px-3 text-base font-normal text-secondary shadow-[0px_1px_2px_0px_color-mix(in_oklab,var(--foreground)_10%,transparent)] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";


export default function JobDetailsStep({ form }: AddJobStepContentProps) {
  const t = useTranslations("jobs");
  const jobTypeOptions = JOB_TYPES.map((value) => ({
    value,
    label: t(`addJobSheet.options.jobType.${value}`),
  }));
  const jobModeOptions = JOB_MODES.map((value) => ({
    value,
    label: t(`addJobSheet.options.jobMode.${value}`),
  }));
  const experienceLevelOptions = EXPERIENCE_LEVELS.map((value) => ({
    value,
    label: t(`addJobSheet.options.experienceLevel.${value}`),
  }));
  const requiredExperienceOptions = REQUIRED_EXPERIENCE_OPTIONS.map((value) => ({
    value,
    label: t("addJobSheet.options.requiredExperienceYears", {
      count: REQUIRED_EXPERIENCE_YEARS[value],
    }),
  }));
  const {
    data: departmentOptionsResponse,
    isLoading: isLoadingDepartmentOptions,
  } = useGetDepartmentsOptionsQuery();

  const industryOptions = React.useMemo(
    () =>
      (departmentOptionsResponse?.data?.data ?? []).map((department) => ({
        value: String(department.id),
        label: department.name,
      })),
    [departmentOptionsResponse],
  );
  // React.useEffect(() => {
  //   if (!form.getValues("departmentId") && industryOptions.length > 0) {
  //     form.setValue("departmentId", industryOptions[0].value);
  //   }
  // }, [form, industryOptions]);

  return (
    <div className="flex pb-6 flex-col gap-6">
      <h3 className="text-xl font-bold leading-6 text-foreground">
        {t("addJobSheet.sections.jobDetails").toUpperCase()}
      </h3>

      <TextFormEle
        form={form}
        name="jobTitle"
        label={t("addJobSheet.fields.jobTitle")}
        placeholder={t("addJobSheet.placeholders.enterJobTitle")}
        inputClassName="text-base text-secondary placeholder:text-secondary"
      />

      <SelectFormEle
        form={form}
        name="jobType"
        label={t("addJobSheet.fields.jobType")}
        placeholder={t("addJobSheet.placeholders.selectJobType")}
        options={jobTypeOptions}
        selectClassName={selectClassName}
      />

      <SelectFormEle
        form={form}
        name="jobMode"
        label={t("addJobSheet.fields.jobMode")}
        placeholder={t("addJobSheet.placeholders.selectJobMode")}
        options={jobModeOptions}
        selectClassName={selectClassName}
      />

      <SelectFormEle
        form={form}
        name="departmentId"
        label={t("addJobSheet.fields.industry")}
        placeholder={t("addJobSheet.placeholders.selectIndustry")}
        options={industryOptions}
        selectClassName={selectClassName}
      />

      <TextFormEle
        form={form}
        name="location"
        label={t("addJobSheet.fields.location")}
        placeholder={t("addJobSheet.placeholders.enterLocation")}
        inputClassName="text-base text-secondary placeholder:text-secondary"
      />

      <SelectFormEle
        form={form}
        name="experienceLevel"
        label={t("addJobSheet.fields.experienceLevel")}
        placeholder={t("addJobSheet.placeholders.selectLevel")}
        options={experienceLevelOptions}
        selectClassName={selectClassName}
      />

      <div className="flex w-full flex-col gap-1">
        <span className="text-base font-medium leading-5 text-foreground">
          {t("addJobSheet.fields.requiredExperience")}{" "}
          <span className="text-xs font-normal leading-4 text-tertiary">
            ({t("addJobSheet.optional")})
          </span>
        </span>
        <SelectFormEle
          form={form}
          name="requiredExperience"
          placeholder={t("addJobSheet.placeholders.selectExperience")}
          options={requiredExperienceOptions}
          className="gap-0"
          selectClassName={selectClassName}
        />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-base font-medium leading-5 text-foreground">
          {t("addJobSheet.fields.jobPostDate")}
        </p>

        <DateTimeFormElement
          form={form}
          name="startDate"
          label={t("addJobSheet.fields.startDate")}
          showTime={false}
        />

        <SwitchFormElement
          form={form}
          name="untilClosed"
          label={t("addJobSheet.fields.untilClosed")}
          className="!mt-0 !min-h-0 !justify-end !gap-3 !rounded-none !border-0 !bg-transparent !px-0 !py-0 !shadow-none"
          labelClassName="text-sm font-medium leading-[18px] text-foreground"
          onIcon={null}
          offIcon={null}
        />

        <DateTimeFormElement
          form={form}
          name="endDate"
          label={t("addJobSheet.fields.endDate")}
          placeholder={t("addJobSheet.fields.endDate")}
          showTime={false}
          disabled={form.watch("untilClosed")}
        />
      </div>
    </div>
  );
}
