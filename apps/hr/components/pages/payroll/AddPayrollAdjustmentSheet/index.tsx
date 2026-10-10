"use client";

import ReusableSheet from "@/components/shared/ResuableSheet";
import { Button } from "@orgtik/ui";
import TextFormEle from "@/components/ui/form/text-form-element";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  FormProvider,
  useForm,
  useWatch,
  SubmitHandler,
} from "react-hook-form";
import { AdjustmentFormValues } from "@/schemas/payroll/adjustment.schemas";
import { usePayrollCurrency } from "@/components/pages/payroll/PayrollCurrency";
import { useAddPayrollAdjustmentMutation } from "@/redux/features/payroll/payrollApi";
import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import { cn } from "@/lib/utils";

export type PayrollAdjustmentKind = "bonus" | "deduction";

const FORM_ID = "payroll-adjustment-form";

type AddPayrollAdjustmentSheetProps = {
  type: PayrollAdjustmentKind;
  trigger: ReactNode;
  className?: string;
  employeeId?: string | number;   
  runId?: number;
  employeeName?: string;          
};

type InputModeType = "fixed" | "days" | "percent" | "months";

export default function AddPayrollAdjustmentSheet({
  type,
  trigger,
  className,
  employeeId,
  runId,
  employeeName,
}: AddPayrollAdjustmentSheetProps) {
  const t = useTranslations("payroll.adjustmentSheet");
  const [open, setOpen] = useState(false);

  const [addPayrollAdjustment, { isLoading }] = useAddPayrollAdjustmentMutation();

  const isEditMode = !!employeeId;
  // The run's currency next to a fixed amount (it always said "CHF").
  const currency = usePayrollCurrency();

  const form = useForm<AdjustmentFormValues>({
    // Off as before: the schema's preprocessed fields don't type-check against these values. To turn it
    // on: zodResolver(makeAdjustmentSchema({ employeeRequired: t("validation.employeeRequired"),
    // valuePositive: t("validation.valuePositive"), tooLong: t("validation.reasonMax") })).
    defaultValues: {
      employeeId: employeeId?.toString() || "",
      inputMode: "fixed",
      description: "",
      amount: 0,
      dayUnits: 0,
      notes: "",
    },
  });


  useEffect(() => {
    if (employeeId) {
      form.setValue("employeeId", employeeId.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [employeeId, form]);


  useEffect(() => {
    if (!open) {
      form.reset({
        employeeId: employeeId?.toString() || "",
        inputMode: "fixed",
        description: "",
        amount: undefined,
        dayUnits: undefined,
        notes: "",
      });
    }
  }, [open, form, employeeId]);

  const inputMode = useWatch({
    control: form.control,
    name: "inputMode",
  }) as InputModeType;

  const onSubmit: SubmitHandler<AdjustmentFormValues> = async (data) => {
    if (!runId) {
      console.error("Missing runId");
      return;
    }

    try {
      let finalValue = 0;
      if (data.inputMode === "fixed" || data.inputMode === "percent") {
        finalValue = Number(data.amount || 0);
      } else if (data.inputMode === "days" || data.inputMode === "months") {
        finalValue = Number(data.dayUnits || 0);
      }

      await addPayrollAdjustment({
        runId: Number(runId),
        body: {
          employeeId: Number(data.employeeId),
          type: type,
          mode: data.inputMode,
          value: finalValue,
          reason: String(data.notes || data.description || "No reason provided"),
        },
      }).unwrap();

      setOpen(false);
    } catch (error) {
      console.error("Failed to add payroll adjustment:", error);
    }
  };

  const isBonus = type === "bonus";
  const title = isBonus ? t("title.bonus") : t("title.deduction");

  const tabsConfig = [
    { id: "fixed", label: t("modes.fixed.label"), subtext: t("modes.fixed.subtext") },
    { id: "days", label: t("modes.days.label"), subtext: t("modes.days.subtext") },
    { id: "percent", label: t("modes.percent.label"), subtext: t("modes.percent.subtext") },
    { id: "months", label: t("modes.months.label"), subtext: t("modes.months.subtext") },
  ];

  const activeTabSubtext = tabsConfig.find((tab) => tab.id === inputMode)?.subtext || "";

  return (
    <ReusableSheet
      open={open}
      onOpenChange={setOpen}
      side="right"
      title={title}
      variant="floating"
      className={className ?? "min-w-[calc(min(90%,500px))]"}
      trigger={trigger}
      footer={
        <>
          <Button size="lg" variant="secondary" type="button" onClick={() => setOpen(false)} disabled={isLoading}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            disabled={isLoading}
            className="bg-info-solid hover:bg-info-solid text-white"
          >
            {isLoading ? t("actions.submitting") : isBonus ? t("actions.submit.bonus") : t("actions.submit.deduction")}
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <form id={FORM_ID} className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* ==================== Employee Field ==================== */}
          {isEditMode ? (
            // <TextFormEle
            //   form={form}
            //   name="employeeId"
            //   label={t("fields.employee")}
            //   value={employeeName || "Employee"}

            //   disabled
            //   className="bg-sunken"
            // />
            <></>
          ) : (
            <EmployeeComboBox
              form={form}
              name="employeeId"
              label={t("fields.employee")}
              placeholder={t("fields.employeePlaceholder")}
              open={open}
              key={`emp-${open}`}
            />
          )}

          {/* ==================== Mode Tabs ==================== */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-fg-muted">
              {isBonus ? t("fields.typeLabel.bonus") : t("fields.typeLabel.deduction")}
            </label>
            <div className="grid grid-cols-4 gap-1 py-1">
              {tabsConfig.map((tab) => {
                const isActive = inputMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => form.setValue("inputMode", tab.id as InputModeType)}
                    className={cn(
                      "py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-center",
                      isActive
                        ? "bg-brand-subtle border border-primary text-primary"
                        : "border rounded-[12px]"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <p className="text-caption text-secondary mt-1">{activeTabSubtext}</p>
          </div>

          {/* ==================== Amount Fields ==================== */}
          {inputMode === "fixed" && (
            <div className="relative">
              <TextFormEle
                form={form}
                name="amount"
                label={t("fields.fixedAmount")}
                type="number"
                placeholder="0"
              />
              {currency ? (
                <span className="absolute end-3 bottom-3 text-sm font-medium text-fg-subtle pointer-events-none">
                  {currency}
                </span>
              ) : null}
            </div>
          )}

          {inputMode === "days" && (
            <div className="relative">
              <TextFormEle
                form={form}
                name="dayUnits"
                label={t("fields.daysValue")}
                type="number"
                placeholder="0"
              />
              <span className="absolute end-3 bottom-3 text-sm font-medium text-fg-subtle pointer-events-none">
                {t("fields.dayUnits")}
              </span>
            </div>
          )}

          {inputMode === "percent" && (
            <div className="relative">
              <TextFormEle
                form={form}
                name="amount"
                label={t("fields.percentValue")}
                type="number"
                placeholder="0"
              />
              <span className="absolute end-3 bottom-3 text-sm font-medium text-fg-subtle pointer-events-none">
                %
              </span>
            </div>
          )}

          {inputMode === "months" && (
            <div className="relative">
              <TextFormEle
                form={form}
                name="dayUnits"
                label={t("fields.monthsValue")}
                type="number"
                placeholder="0"
              />
              <span className="absolute end-3 bottom-3 text-sm font-medium text-fg-subtle pointer-events-none">
                {t("modes.months.label")}
              </span>
            </div>
          )}

          <TextFormEle
            form={form}
            name="notes"
            label={t("fields.notes")}
            placeholder={t("fields.notesPlaceholder")}
            type="textarea"
          />
        </form>
      </FormProvider>
    </ReusableSheet>
  );
}