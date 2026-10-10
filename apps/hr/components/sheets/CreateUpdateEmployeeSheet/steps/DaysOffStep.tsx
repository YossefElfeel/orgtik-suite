"use client";
import React, { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import { Button } from "@orgtik/ui";
import { useUpdateOnboardingStepMutation, useGetOnboardingStepQuery } from "@/redux/features/employee/employeeApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { toast } from "sonner";
import { WIZARD_STEP_TO_API_KEY, transformApiDataToFormValues } from "../utils";
import { useSearchParams } from "next/navigation";
import { onFormErrorDisplay } from "@/lib/form-error-toast";
import type { EmployeeFormValues } from "@/types/employee";

function parseDays(raw: unknown): number {
  const n = parseFloat(String(raw ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const RequiredLabel = ({ label }: { label: string }) => (
  <span>
    {label} <span className="text-destructive">*</span>
  </span>
);

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { makeDaysOffSchema, type DaysOffFormValues } from "../schemas";
import { useEmployeeWizard } from "../EmployeeWizardContext";

type FormType = DaysOffFormValues;

export function DaysOffStep() {
  const { data, onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const [updateOnboarding] = useUpdateOnboardingStepMutation();
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const schema = useMemo(() => makeDaysOffSchema(t), [t]);
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id");
  const form = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: data as any,
    mode: "onBlur",
  });

  const { data: stepApiResponse } = useGetOnboardingStepQuery(
    { id: employeeId!, step: WIZARD_STEP_TO_API_KEY.daysOff },
    { skip: !employeeId }
  );

  useEffect(() => {
    if (stepApiResponse?.success && stepApiResponse.data?.data) {
      const transformed = transformApiDataToFormValues("daysOff", stepApiResponse.data.data);
      form.reset(transformed as any);
    }
  }, [stepApiResponse, form]);

  const [
    annualLeaveDays,
    casualLeaveDays,
    sickLeaveDays,
    contractAddsDays,
  ] = useWatch({
    control: form.control,
    name: [
      "annualLeaveDays",
      "casualLeaveDays",
      "sickLeaveDays",
      "contractAddsDays",
    ],
  });

  const unpaidLeaveOptions = [
    { value: "allowed", label: t("options.unpaidLeave.allowed") },
    { value: "not_allowed", label: t("options.unpaidLeave.notAllowed") },
  ];

  const allEmpty = [
    annualLeaveDays,
    casualLeaveDays,
    sickLeaveDays,
    contractAddsDays,
  ].every((v) => v === "" || v === null || v === undefined);

  const total = allEmpty
    ? ""
    : (
      parseDays(annualLeaveDays) +
      parseDays(casualLeaveDays) +
      parseDays(sickLeaveDays) +
      parseDays(contractAddsDays)
    ).toString();

  useEffect(() => {
    form.setValue("totalDaysOff", total);
  }, [form, total]);

  const formatPayload = (values: FormType) => {
    return {
      step: "days_off" as const,
      data: {
        annualLeave: parseDays(values.annualLeaveDays),
        casualLeave: parseDays(values.casualLeaveDays),
        sickLeave: parseDays(values.sickLeaveDays),
        unpaidLeavePolicy: values.unpaidLeave,
        contractAdds: parseDays(values.contractAddsDays),
      },
    };
  };

  const onSubmit = async (values: FormType) => {
    if (!employeeId) return toast.error(t("errors.noEmployeeId"));

    const payload = formatPayload(values);

    await reqWithToaster(t("toasts.updatingDaysOff"), async () => {
      const res = await updateOnboarding({ id: employeeId, body: payload }).unwrap();
      if (res.data?.completedSteps) {
        setCompletedSteps(res.data.completedSteps);
      }
      onNext(values as any);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormErrorDisplay)} className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {t("steps.daysOff.heading")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("steps.daysOff.description")}
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <TextFormEle
            form={form}
            name="annualLeaveDays"
            label={<RequiredLabel label={t("fields.annualLeaveDays")} />}
            type="number"
            placeholder={t("placeholders.value")}
          />
          <TextFormEle
            form={form}
            name="casualLeaveDays"
            label={<RequiredLabel label={t("fields.casualLeaveDays")} />}
            type="number"
            placeholder={t("placeholders.value")}
          />
          <TextFormEle
            form={form}
            name="sickLeaveDays"
            label={<RequiredLabel label={t("fields.sickLeaveDays")} />}
            type="number"
            placeholder={t("placeholders.value")}
          />
          <SelectFormEle
            form={form}
            name="unpaidLeave"
            label={<RequiredLabel label={t("fields.unpaidLeave")} />}
            options={unpaidLeaveOptions}
            placeholder={t("fields.unpaidLeavePlaceholder")}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />
          <TextFormEle
            form={form}
            name="contractAddsDays"
            label={t("fields.contractAddsDays")}
            type="number"
            placeholder={t("placeholders.value")}
          />
          <TextFormEle
            form={form}
            name="totalDaysOff"
            label={t("fields.totalDaysOff")}
            readOnly
            placeholder={t("placeholders.value")}
            inputClassName="bg-muted"
          />
        </div>
        {/* Navigation Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            className="min-w-32"
            type="button"
            size="lg"
            variant="secondary"
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
