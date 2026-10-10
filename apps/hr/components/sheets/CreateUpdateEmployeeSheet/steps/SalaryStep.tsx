"use client";
import { Info as InfoIcon } from "@phosphor-icons/react";

import React, { useEffect, useMemo } from "react";
import { useWatch, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useSearchParams } from "next/navigation";

import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle from "@/components/ui/form/select-form-element";
import { Button } from "@orgtik/ui";
import { cn } from "@/lib/utils";
import { useEmployeeWizard } from "../EmployeeWizardContext";
import { useUpdateOnboardingStepMutation, useGetOnboardingStepQuery } from "@/redux/features/employee/employeeApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { WIZARD_STEP_TO_API_KEY, transformApiDataToFormValues } from "../utils";
import { onFormErrorDisplay } from "@/lib/form-error-toast";

import type { IOnboardingStepDTO } from "@/types/employee";
import { makeSalarySchema, type SalaryFormValues } from "../schemas";

function parseAmount(raw: unknown): number {
  const n = parseFloat(String(raw ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function computeWithType(
  raw: unknown,
  type: "fixed" | "percentage",
  base: number
) {
  const value = parseAmount(raw);
  if (type === "percentage") return (base * value) / 100;
  return value;
}

type FormType = SalaryFormValues;

const RequiredLabel = ({ label }: { label: string }) => (
  <span>
    {label} <span className="text-destructive">*</span>
  </span>
);

export function SalaryStep() {
  const { data, onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const [updateOnboarding] = useUpdateOnboardingStepMutation();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id");
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const schema = useMemo(() => makeSalarySchema(t), [t]);

  const TYPE_OPTIONS = [
    { value: "fixed", label: t("options.amountType.fixed") },
    { value: "percentage", label: t("options.amountType.percentage") },
  ];

  const form = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: data as any,
    mode: "onBlur",
  });

  const { data: stepApiResponse } = useGetOnboardingStepQuery(
    { id: employeeId!, step: WIZARD_STEP_TO_API_KEY.salary },
    { skip: !employeeId }
  );

  useEffect(() => {
    if (stepApiResponse?.success && stepApiResponse.data?.data) {
      const transformed = transformApiDataToFormValues("salary", stepApiResponse.data.data);
      form.reset(transformed as any);
    }
  }, [stepApiResponse, form]);

  const [
    baseSalary,
    housingAllowance,
    housingAllowanceType,
    transportationAllowance,
    transportationAllowanceType,
    otherAllowances,
    otherAllowancesType,
    insurance,
    insuranceType,
    tax,
    taxType,
  ] = useWatch({
    control: form.control,
    name: [
      "baseSalary",
      "housingAllowance",
      "housingAllowanceType",
      "transportationAllowance",
      "transportationAllowanceType",
      "otherAllowances",
      "otherAllowancesType",
      "insurance",
      "insuranceType",
      "tax",
      "taxType",
    ],
  });

  const base = parseAmount(baseSalary);
  const housing = computeWithType(housingAllowance, housingAllowanceType, base);
  const transportation = computeWithType(
    transportationAllowance,
    transportationAllowanceType,
    base
  );
  const other = computeWithType(otherAllowances, otherAllowancesType, base);
  const totalSalary = base + housing + transportation + other;

  const insuranceValue = computeWithType(insurance, insuranceType, totalSalary);
  const taxValue = computeWithType(tax, taxType, totalSalary);
  const netSalary = totalSalary - insuranceValue - taxValue;

  useEffect(() => {
    form.setValue("totalSalary", totalSalary.toFixed(2));
    form.setValue("netSalary", netSalary.toFixed(2));
  }, [form, totalSalary, netSalary]);

  const onSubmit = async (values: FormType) => {
    if (!employeeId) {
      console.warn("No employee_id found in URL, skipping API call");
      onNext(values as any);
      return;
    }

    const payload: IOnboardingStepDTO = {
      step: "salary",
      data: {
        baseSalary: parseAmount(values.baseSalary),
        paymentMethod: (data as any)?.paymentType || "bank",
        housingAllowanceValue: parseAmount(values.housingAllowance),
        housingAllowanceType: values.housingAllowanceType,
        transportationAllowanceValue: parseAmount(values.transportationAllowance),
        transportationAllowanceType: values.transportationAllowanceType,
        otherAllowancesValue: parseAmount(values.otherAllowances),
        otherAllowancesType: values.otherAllowancesType,
        insuranceValue: parseAmount(values.insurance),
        insuranceType: values.insuranceType,
        taxValue: parseAmount(values.tax),
        taxType: values.taxType,
      },
    };

    await reqWithToaster(t("toasts.updatingSalaryInfo"), async () => {
      const res = await updateOnboarding({ id: employeeId, body: payload }).unwrap();
      if (res.data?.completedSteps) {
        setCompletedSteps(res.data.completedSteps);
      }
      onNext(values as any);
    });
  };

  const renderValueWithType = (
    valueName: keyof FormType,
    typeName: keyof FormType,
    label: string
  ) => (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
        <TextFormEle
          form={form}
          name={valueName as any}
          placeholder={t("placeholders.value")}
          type="number"
          inputClassName="text-base"
        />
        <SelectFormEle
          form={form}
          name={typeName as any}
          options={TYPE_OPTIONS}
          emptyOptionValue={undefined as any}
          selectClassName="text-sm"
        />
      </div>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormErrorDisplay)} className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {t("steps.salary.heading")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("steps.salary.description")}
          </p>
        </header>

        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span><RequiredLabel label={t("fields.baseSalary")} /></span>
              <InfoIcon className="size-4 text-muted-foreground" />
            </div>
            <TextFormEle
              form={form}
              name="baseSalary"
              placeholder={t("placeholders.value")}
              type="number"
              inputClassName="text-base"
            />
          </div>

          {renderValueWithType(
            "housingAllowance",
            "housingAllowanceType",
            t("fields.housingAllowance")
          )}
          {renderValueWithType(
            "transportationAllowance",
            "transportationAllowanceType",
            t("fields.transportationAllowance")
          )}
          {renderValueWithType(
            "otherAllowances",
            "otherAllowancesType",
            t("fields.otherAllowances")
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("fields.totalSalary")}
            </span>
            <TextFormEle
              form={form}
              name="totalSalary"
              placeholder={t("placeholders.value")}
              readOnly
              inputClassName={cn("text-base bg-muted")}
            />
          </div>

          {renderValueWithType(
            "insurance",
            "insuranceType",
            t("fields.insurance")
          )}
          {renderValueWithType("tax", "taxType", t("fields.tax"))}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("fields.netSalary")}
            </span>
            <TextFormEle
              form={form}
              name="netSalary"
              placeholder={t("placeholders.value")}
              readOnly
              inputClassName={cn("text-base bg-muted")}
            />
          </div>
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
