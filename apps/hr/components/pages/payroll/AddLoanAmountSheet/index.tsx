"use client";
import { Info, Plus } from "@phosphor-icons/react";

import ReusableSheet from "@/components/shared/ResuableSheet";
import { Button } from "@/components/ui/button";
import TextFormEle from "@/components/ui/form/text-form-element";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { useAddPayrollLoanToRunMutation } from "@/redux/features/payroll/payrollApi";

const FORM_ID = "payroll-loan-add-amount-form";

type FormValues = {
  totalLoans: number;
  paidMonthly: number;
  addedAmount: number;
  remainingAmount: number;
};

type AddLoanAmountSheetProps = {
  runId?: number;
  employeeId?: number;
  trigger?: React.ReactNode;
};

export default function AddLoanAmountSheet({ runId, employeeId, trigger }: AddLoanAmountSheetProps) {
  const t = useTranslations("payroll.loanDetail.addAmountSheet");
  const [open, setOpen] = useState(false);

  const [addLoanToRun, { isLoading }] = useAddPayrollLoanToRunMutation();

  const schema = z.object({
    totalLoans: z.number(),
    paidMonthly: z.number(),
    addedAmount: z.number().min(0, t("validation.addedMin")),
    remainingAmount: z.number(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalLoans: 30000,
      paidMonthly: 15000,
      addedAmount: 15000,
      remainingAmount: 15000,
    },
  });

  async function onSubmit(data: FormValues) {
    if (!runId || !employeeId) return;
    try {
      await addLoanToRun({
        runId,
        body: {
          employeeId,
          loanId: 1, // Placeholder: in a real app, this would come from the specific loan being added
          amount: data.addedAmount,
          notes: "Added via payroll dashboard",
        },
      }).unwrap();
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to add loan to run:", error);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      form.reset({
        totalLoans: 30000,
        paidMonthly: 15000,
        addedAmount: 15000,
        remainingAmount: 15000,
      });
    }
  }

  return (
    <ReusableSheet
      open={open}
      onOpenChange={handleOpenChange}
      side="right"
      title={t("title")}
      trigger={
        trigger || (
          <Button size="lg">
            <Plus className="size-4.5" />
            {t("trigger")}
          </Button>
        )
      }
      footer={
        <>
          <Button
            size="lg"
            variant="outline"
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
          <TextFormEle
            form={form}
            name="totalLoans"
            label={t("fields.totalLoans")}
            type="number"
            readOnly
            disabled
          />
          <TextFormEle
            form={form}
            name="paidMonthly"
            label={t("fields.paidMonthly")}
            type="number"
            readOnly
            disabled
          />
          <TextFormEle
            form={form}
            name="addedAmount"
            label={t("fields.addedAmount")}
            type="number"
            placeholder={t("fields.addedAmountPlaceholder")}
          />
          <div className="space-y-1.5">
            <TextFormEle
              form={form}
              name="remainingAmount"
              label={t("fields.remainingAmount")}
              type="number"
              readOnly
              disabled
            />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0" aria-hidden />
              {t("helper.remainingCalculated")}
            </p>
          </div>
        </form>
      </FormProvider>
    </ReusableSheet>
  );
}
