"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEmployeeWizard } from "../EmployeeWizardContext";
import { useUpdateOnboardingStepMutation, useGetOnboardingStepQuery } from "@/redux/features/employee/employeeApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { WIZARD_STEP_TO_API_KEY, transformApiDataToFormValues } from "../utils";
import React, { useEffect, useMemo } from "react";
import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle from "@/components/ui/form/select-form-element";
import type { IOnboardingStepDTO } from "@/types/employee";
import { makeBankSchema, type BankFormValues } from "../schemas";
import { onFormErrorDisplay } from "@/lib/form-error-toast";

type FormType = BankFormValues;

export function BankInfoStep() {
  const { data, onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const [updateOnboarding] = useUpdateOnboardingStepMutation();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id");
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const schema = useMemo(() => makeBankSchema(t), [t]);

  const form = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: data as any,
    mode: "onBlur",
  });

  const { data: stepApiResponse } = useGetOnboardingStepQuery(
    { id: employeeId!, step: WIZARD_STEP_TO_API_KEY.bank },
    { skip: !employeeId }
  );

  useEffect(() => {
    if (stepApiResponse?.success && stepApiResponse.data?.data) {
      const transformed = transformApiDataToFormValues("bank", stepApiResponse.data.data);
      form.reset(transformed as any);
    }
  }, [stepApiResponse, form]);

  const paymentType = form.watch("paymentType") || "bank";

  const tabs = [
    { id: "bank", label: t("options.paymentTypes.bank") },
    { id: "instapay", label: t("options.paymentTypes.instapay") },
    { id: "wallet", label: t("options.paymentTypes.wallet") },
  ] as const;

  const walletOptions = [
    { value: "vodafone", label: t("options.wallets.vodafone") },
    { value: "orange", label: t("options.wallets.orange") },
    { value: "etisalat", label: t("options.wallets.etisalat") },
    { value: "we", label: t("options.wallets.we") },
  ];

  const paymentCycleOptions = [
    { value: "monthly", label: t("options.paymentCycle.monthly") },
    { value: "biweekly", label: t("options.paymentCycle.biweekly") },
    { value: "weekly", label: t("options.paymentCycle.weekly") },
  ];

  const currencyOptions = [
    { value: "EGP", label: "EGP" },
    { value: "SAR", label: "SAR" },
    { value: "USD", label: "USD" },
    { value: "CHF", label: "CHF" },
    { value: "EUR", label: "EUR" },
  ];

  const onSubmit = async (values: FormType) => {
    if (!employeeId) {
      console.warn("No employee_id found in URL, skipping API call");
      onNext(values);
      return;
    }

    let stepData: any = {
      paymentMethod: values.paymentType,
    };

    if (values.paymentType === "bank") {
      stepData.bank = {
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolderName: values.accountHolder,
        iban: values.iban,
        currency: values.currency || "EGP",
        paymentCycle: values.paymentCycle || "monthly",
      };
    } else if (values.paymentType === "instapay") {
      stepData.instapay = {
        registeredNumber: values.instapayNumber,
        accountName: values.instapayAccountName,
        linkedAccount: values.instapayLinkedAccount,
        paymentCycle: values.paymentCycle || "monthly",
      };
    } else if (values.paymentType === "wallet") {
      stepData.wallet = {
        walletName: values.walletName,
        phoneNumber: values.walletPhoneNumber,
        accountName: values.walletAccountName,
        paymentCycle: values.paymentCycle || "monthly",
      };
    }

    const payload: IOnboardingStepDTO = {
      step: "payment_method",
      data: stepData,
    };

    await reqWithToaster(t("toasts.updatingPaymentInfo"), async () => {
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
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar bg-muted p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => form.setValue("paymentType", tab.id)}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                paymentType === tab.id
                  ? "bg-raised text-fg shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <header className="space-y-1">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {paymentType === "bank" && t("steps.bank.heading")}
            {paymentType === "instapay" && t("steps.bank.instapay")}
            {paymentType === "wallet" && t("steps.bank.wallet")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {paymentType === "bank" && t("steps.bank.description")}
            {paymentType === "instapay" && t("steps.bank.instapayDescription")}
            {paymentType === "wallet" && t("steps.bank.walletDescription")}
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <SelectFormEle
            form={form}
            name="paymentCycle"
            label={t("fields.paymentCycle")}
            placeholder={t("placeholders.paymentCycle")}
            options={paymentCycleOptions}
          />

          {paymentType === "bank" && (
            <>
              <TextFormEle
                form={form}
                name="bankName"
                label={t("fields.bankName")}
                placeholder={t("placeholders.bankName")}
              />
              <TextFormEle
                form={form}
                name="accountNumber"
                label={t("fields.accountNumber")}
                placeholder={t("placeholders.accountNumber")}
              />
              <TextFormEle
                form={form}
                name="accountHolder"
                label={t("fields.accountHolder")}
                placeholder={t("placeholders.accountHolder")}
              />
              <TextFormEle
                form={form}
                name="iban"
                label={t("fields.iban")}
                placeholder={t("placeholders.iban")}
              />
              <SelectFormEle
                form={form}
                name="currency"
                label={t("fields.salaryCurrency")}
                placeholder={t("placeholders.currency")}
                options={currencyOptions}
              />
              <TextFormEle
                form={form}
                name="bankCode"
                label={t("fields.bankCode")}
                placeholder={t("placeholders.bankCode")}
              />
              <TextFormEle
                form={form}
                name="salaryChf"
                label={t("fields.salaryChf")}
                placeholder={t("placeholders.salaryChf")}
              />
            </>
          )}

          {paymentType === "instapay" && (
            <>
              <TextFormEle
                form={form}
                name="instapayNumber"
                label={t("fields.instapayNumber")}
                placeholder={t("placeholders.instapayNumber")}
              />
              <TextFormEle
                form={form}
                name="instapayAccountName"
                label={t("fields.instapayAccountName")}
                placeholder={t("placeholders.instapayAccountName")}
              />
              <TextFormEle
                form={form}
                name="instapayLinkedAccount"
                label={t("fields.instapayLinkedAccount")}
                placeholder={t("placeholders.instapayLinkedAccount")}
              />
            </>
          )}

          {paymentType === "wallet" && (
            <>
              <SelectFormEle
                form={form}
                name="walletName"
                label={t("fields.walletName")}
                placeholder={t("placeholders.walletName")}
                options={walletOptions}
              />
              <TextFormEle
                form={form}
                name="walletPhoneNumber"
                label={t("fields.walletPhoneNumber")}
                placeholder={t("placeholders.walletPhoneNumber")}
              />
              <TextFormEle
                form={form}
                name="walletAccountName"
                label={t("fields.walletAccountName")}
                placeholder={t("placeholders.walletAccountName")}
              />
            </>
          )}
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
