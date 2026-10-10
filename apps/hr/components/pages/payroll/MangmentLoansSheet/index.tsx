"use client";
import { Plus } from "@phosphor-icons/react";

import ReusableSheet from "@/components/shared/ResuableSheet";
import { Button } from "@orgtik/ui";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { useCreatePayrollLoanMutation } from "@/redux/features/payroll/payrollApi";
import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import { useMemo } from "react";

const FORM_ID = "payroll-loans-form";

const DURATION_MONTH_VALUES = ["6", "12", "18", "24"] as const;

type FormValues = {
  employeeId: string;
  totalLoans: number;
  durationMonths: string;
  paidMonthly: number;
  description?: string;
};

type MangmentLoansSheetProps = {
  className?: string;
};

export default function MangmentLoansSheet({
  className,
}: MangmentLoansSheetProps) {
  const t = useTranslations("payroll.loansSheet");
  const [open, setOpen] = useState(false);

  const [createLoan, { isLoading }] = useCreatePayrollLoanMutation();

  const schema = z.object({
    employeeId: z.string().min(1, t("validation.employeeRequired")),
    totalLoans: z.number().min(1, t("validation.totalRequired")),
    durationMonths: z.string().min(1, t("validation.durationRequired")),
    paidMonthly: z.number(),
    description: z.string().optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      totalLoans: undefined,
      durationMonths: "",
      paidMonthly: undefined,
      description: "",
    },
  });

  const totalLoans = form.watch("totalLoans");
  const durationMonths = form.watch("durationMonths");

  useMemo(() => {
    if (totalLoans && durationMonths) {
      const monthly = totalLoans / parseInt(durationMonths);
      form.setValue("paidMonthly", Math.round(monthly));
    }
  }, [totalLoans, durationMonths, form]);

  async function onSubmit(data: FormValues) {
    try {
      await createLoan({
        employeeId: Number(data.employeeId),
        title: data.description || "Employee Loan",
        principalAmount: data.totalLoans,
        durationMonths: parseInt(data.durationMonths),
        installmentAmount: data.paidMonthly,
        currency: "CHF",
        startDate: new Date().toISOString().split("T")[0],
        reason: data.description,
      }).unwrap();
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to create loan:", error);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      form.reset({
        employeeId: "",
        totalLoans: 0,
        durationMonths: "",
        paidMonthly: 2000,
      });
    }
  }

  return (
    <ReusableSheet
      open={open}
      onOpenChange={handleOpenChange}
      side="right"
      title={t("title")}
      className={className ?? "min-w-[calc(min(90%,500px))]"}
      trigger={
        <Button size="lg">
          <Plus className="size-4.5" aria-hidden="true" />
          {t("trigger")}
        </Button>
      }
      footer={
        <>
          <Button
            size="lg"
            variant="secondary"
            type="button"
            onClick={() => handleOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} size="lg">
            {t("actions.submit")}
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <form
          id={FORM_ID}
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <EmployeeComboBox
            form={form}
            name="employeeId"
            label={t("fields.employee")}
            placeholder={t("fields.employeePlaceholder")}
            open={open}
          />
          <TextFormEle
            form={form}
            name="totalLoans"
            label={t("fields.totalLoans")}
            placeholder={t("fields.totalLoansPlaceholder")}
            type="number"
          />
          <SelectFormEle
            form={form}
            name="durationMonths"
            label={t("fields.duration")}
            placeholder={t("fields.durationPlaceholder")}
            options={DURATION_MONTH_VALUES.map((m) => ({
              value: m,
              label: t(`duration.${m}`),
            }))}
            emptyOptionValue={SELECT_EMPTY_VALUE}
          />
          <TextFormEle
            form={form}
            name="paidMonthly"
            label={t("fields.paidMonthly")}
            placeholder=""
            type="number"
            readOnly
            disabled
          />
          <TextFormEle
            form={form as any}
            name="description"
            label={t("fields.reason")}
            placeholder={t("fields.reasonPlaceholder")}
            type="textarea"
          />
        </form>
      </FormProvider>
    </ReusableSheet>
  );
}
