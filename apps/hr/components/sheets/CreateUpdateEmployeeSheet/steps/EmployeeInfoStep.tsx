"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import EmployeeAvatarInput from "@/components/shared/EmployeeAvatarInput";


import type { IOnboardingStepDTO } from "@/types/employee";
import { makeEmployeeSchema, type EmployeeInfoFormValues } from "../schemas";

import { useEmployeeWizard } from "../EmployeeWizardContext";
import { useUpdateOnboardingStepMutation, useGetOnboardingStepQuery, useGetEmployeeQuery } from "@/redux/features/employee/employeeApi";
import { useGetDepartmentsQuery } from "@/redux/features/department/departmentApi";
import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { WIZARD_STEP_TO_API_KEY, transformApiDataToFormValues } from "../utils";
import React, { useEffect, useMemo } from "react";
import { onFormErrorDisplay } from "@/lib/form-error-toast";

type FormType = EmployeeInfoFormValues;

const RequiredLabel = ({ label }: { label: string }) => (
  <span>
    {label} <span className="text-destructive">*</span>
  </span>
);

export function EmployeeInfoStep() {
  const { data, onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const [updateOnboarding] = useUpdateOnboardingStepMutation();
  const { data: deptsData } = useGetDepartmentsQuery({ limit: 100 });
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id");
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const schema = useMemo(() => makeEmployeeSchema(t), [t]);

  // The values are the API's codes; only the labels are translated.
  const EMPLOYEE_TYPE_OPTIONS = [
    { value: SELECT_EMPTY_VALUE, label: t("placeholders.employeeType") },
    { value: "full_time", label: t("options.employment.fullTime") },
    { value: "part_time", label: t("options.employment.partTime") },
    { value: "contract", label: t("options.employment.contract") },
    { value: "intern", label: t("options.employment.intern") },
  ];

  const STATUS_OPTIONS = [
    { value: SELECT_EMPTY_VALUE, label: t("placeholders.status") },
    { value: "active", label: t("options.status.active") },
    { value: "inactive", label: t("options.status.inactive") },
    { value: "probation", label: t("options.status.probation") },
    { value: "terminated", label: t("options.status.terminated") },
  ];

  const SKILL_OPTIONS = [
    { value: "ui", label: t("options.skills.ui") },
    { value: "ux", label: t("options.skills.ux") },
    { value: "frontend", label: t("options.skills.frontend") },
    { value: "backend", label: t("options.skills.backend") },
    { value: "hr_ops", label: t("options.skills.hrOps") },
  ];

  const EXPERIENCE_LEVEL_OPTIONS = [
    { value: SELECT_EMPTY_VALUE, label: t("placeholders.experienceLevel") },
    { value: "intern_level", label: t("options.experienceLevel.intern") },
    { value: "junior", label: t("options.experienceLevel.junior") },
    { value: "mid_level", label: t("options.experienceLevel.midLevel") },
    { value: "senior_level", label: t("options.experienceLevel.senior") },
    { value: "lead", label: t("options.experienceLevel.lead") },
    { value: "principal", label: t("options.experienceLevel.principal") },
  ];

  const departmentOptions = [
    { value: SELECT_EMPTY_VALUE, label: t("fields.departmentPlaceholder") },
    ...(deptsData?.data?.items?.map((d) => ({
      value: d.id.toString(),
      label: d.name,
    })) || []),
  ];

  const form = useForm<FormType>({
    resolver: zodResolver(schema as any),
    defaultValues: data as any,
    mode: "onBlur",
  });

  const managerId = form.watch("manager");
  const { data: managerDetailData } = useGetEmployeeQuery(managerId ?? "", { skip: !managerId });

  const initialManagerOptions = useMemo(() => {
    if (!managerId) return [];
    if (managerDetailData?.data) {
      const personalInfo = managerDetailData.data.personalInformation;
      return [
        {
          value: String(managerDetailData.data.id),
          label: personalInfo?.fullName || `${personalInfo?.firstName || ""} ${personalInfo?.lastName || ""}`.trim() || t("fields.manager"),
        },
      ];
    }
    return [
      {
        value: String(managerId),
        label: t("loading"),
      },
    ];
  }, [managerId, managerDetailData, t]);

  const { data: stepApiResponse } = useGetOnboardingStepQuery(
    { id: employeeId!, step: WIZARD_STEP_TO_API_KEY.employee },
    { skip: !employeeId }
  );

  useEffect(() => {
    if (stepApiResponse?.success && stepApiResponse.data?.data) {
      const transformed = transformApiDataToFormValues("employee", stepApiResponse.data.data);
      form.reset(transformed as any);
    }
  }, [stepApiResponse, form]);

  const WORK_TYPE_OPTIONS = [
    { value: SELECT_EMPTY_VALUE, label: t("placeholders.workType") },
    { value: "remote", label: t("options.workType.remote") },
    { value: "onsite", label: t("options.workType.onSite") },
    { value: "hybrid", label: t("options.workType.hybrid") },
  ];

  const onSubmit = async (values: FormType) => {
    if (!employeeId) {
      console.warn("No employee_id found in URL, skipping API call");
      onNext(values);
      return;
    }

    const payload: IOnboardingStepDTO = {
      step: "employee_info",
      data: {
        jobTitle: values.jobTitle,
        departmentId: parseInt(values.department),
        employeeType: values.employeeType,
        joinDate: values.joinDate
          ? new Date(values.joinDate).toISOString().split("T")[0]
          : "",
        workLocation: values.workType,
        managerId: values.manager ? parseInt(values.manager) : undefined,
        status: values.status,
        experienceLevel: values.experienceLevel,
        skills: values.employeeSkills || [],
      },
    };

    await reqWithToaster(t("toasts.updatingEmployeeInfo"), async () => {
      const res = await updateOnboarding({ id: employeeId, body: payload }).unwrap();
      if (res.data?.completedSteps) {
        setCompletedSteps(res.data.completedSteps);
      }
      onNext(values);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormErrorDisplay)} className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {t("steps.employee.heading")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("steps.employee.description")}
          </p>
        </header>

        {employeeId && <EmployeeAvatarInput id={employeeId} />}

        <div className="flex flex-col gap-4">
          <TextFormEle
            form={form}
            name="jobTitle"
            label={t("fields.jobTitle")}
            placeholder={t("placeholders.jobTitle")}
          />
          <SelectFormEle
            form={form}
            name="department"
            label={<RequiredLabel label={t("fields.department")} />}
            options={departmentOptions}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />
          <SelectFormEle
            form={form}
            name="employeeType"
            label={<RequiredLabel label={t("fields.employeeType")} />}
            options={EMPLOYEE_TYPE_OPTIONS}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />
          <SelectFormEle
            form={form}
            name="experienceLevel"
            label={<RequiredLabel label={t("fields.experienceLevel")} />}
            options={EXPERIENCE_LEVEL_OPTIONS}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />
          <EmployeeComboBox
            form={form}
            name="manager"
            label={t("fields.managerOptional")}
            placeholder={t("placeholders.selectManager")}
            searchPlaceholder={t("placeholders.search")}
            open={true}
            initialOptions={initialManagerOptions}
          />
          <SelectFormEle
            form={form}
            name="status"
            label={<RequiredLabel label={t("fields.status")} />}
            options={STATUS_OPTIONS}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />
          <SelectFormEle
            form={form}
            name="workType"
            label={<RequiredLabel label={t("fields.workType")} />}
            options={WORK_TYPE_OPTIONS}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />
          <DateTimeFormElement
            form={form}
            name="joinDate"
            label={<RequiredLabel label={t("fields.joinDate")} />}
            placeholder={t("placeholders.joinDate")}
            showTime={false}
          />
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <header className="space-y-1">
            <h3 className="text-lg font-medium leading-6 text-foreground">
              {t("steps.employee.skillsHeading")}
            </h3>
            <p className="text-xs leading-4 text-muted-foreground">
              {t("steps.employee.skillsDescription")}
            </p>
          </header>
          <ComboboxFormEle
            form={form}
            name="employeeSkills"
            label={t("fields.employeeSkills")}
            options={SKILL_OPTIONS}
            multiple
            placeholder={t("placeholders.skills")}
            searchPlaceholder={t("placeholders.searchSkills")}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            className="min-w-32"
            type="button"
            size="lg"
            variant="outline"
            onClick={onBack}
          >
            {t("nav.back")}
          </Button>
          <Button type="submit" className="min-w-32" size="lg">
            {isLastStep
              ? isEdit
                ? t("nav.save")
                : t("nav.submit")
              : t("nav.next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
