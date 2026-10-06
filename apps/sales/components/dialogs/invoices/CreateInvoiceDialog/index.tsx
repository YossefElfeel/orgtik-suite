"use client";

import { useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import CreateInvoiceStepper, {
  createInvoiceSteps,
} from "@/components/dialogs/invoices/CreateInvoiceDialog/CreateInvoiceStepper";
import CreateInvoiceRecipientStep from "@/components/dialogs/invoices/CreateInvoiceDialog/CreateInvoiceRecipientStep";
import CreateInvoiceItemsStep from "@/components/dialogs/invoices/CreateInvoiceDialog/CreateInvoiceItemsStep";
import {
  createInvoiceSchema,
  createInvoiceStepFields,
  type CreateInvoiceFormValues,
} from "@/schemas/create-invoice";
import type { PillTabsActiveTooltip } from "@/types/tabs";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
};

function createEmptyLineItem() {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: "",
    quantity: 0,
    unitPrice: 0,
  };
}

const defaultValues: CreateInvoiceFormValues = {
  billToType: "customer",
  customerId: "",
  salesmanId: "",
  billingAddress: "",
  projectId: "",
  dueDate: "",
  // The sender is the organisation; it was pre-filled with a fixture company (SAL-023).
  senderName: "",
  senderAddress: "",
  lineItems: [createEmptyLineItem()],
  notes: "",
  currency: "SAR",
  paymentMethod: "bank_transfer",
  transferReference: "",
  cardNumber: "",
  paymentDetails: "",
  markAsPaidNow: false,
};

export default function CreateInvoiceDialog({ trigger }: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [stepTooltip, setStepTooltip] = useState<PillTabsActiveTooltip | null>(
    null,
  );

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const isLastStep = step === createInvoiceSteps.length - 1;

  const resetWizard = () => {
    setStep(0);
    setStepTooltip(null);
    form.reset({
      ...defaultValues,
      lineItems: [createEmptyLineItem()],
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetWizard();
    } else {
      form.reset({
        ...defaultValues,
        lineItems: [createEmptyLineItem()],
      });
    }
  };

  const handleSubmit = (data: CreateInvoiceFormValues) => {
    console.log("create-invoice", data);
    toast.success(t("invoiceCreatedSuccessfully"));
    handleOpenChange(false);
  };

  const handleNext = async () => {
    setStepTooltip(null);
    const fields = createInvoiceStepFields[step] ?? [];
    const valid = await form.trigger(fields);
    if (!valid) return;

    if (isLastStep) {
      void form.handleSubmit(handleSubmit)();
      return;
    }

    setStep((current) => Math.min(current + 1, createInvoiceSteps.length - 1));
  };

  const handleStepChange = async (targetStep: number) => {
    setStepTooltip(null);

    if (targetStep === step) return;

    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    for (let stepIndex = 0; stepIndex < targetStep; stepIndex += 1) {
      const fields = createInvoiceStepFields[stepIndex] ?? [];
      const valid = await form.trigger(fields);

      if (!valid) {
        const incompleteStep = createInvoiceSteps[stepIndex];
        const targetStepLabel = createInvoiceSteps[targetStep]?.labelKey
          ? t(createInvoiceSteps[targetStep].labelKey)
          : t("thatStep");

        setStep(stepIndex);
        setStepTooltip({
          tabId: createInvoiceSteps[targetStep]?.id ?? "",
          content: t("completeStepBeforeContinuing", {
            incompleteStep: incompleteStep?.labelKey
              ? t(incompleteStep.labelKey)
              : t("thePreviousStep"),
            targetStepLabel,
          }),
        });
        return;
      }
    }

    setStep(targetStep);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("createInvoice")}
      size="4xl"
      expandable
      showFooter
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <DialogClose
            render={
              <Button type="button" variant="outline" onClick={resetWizard} />
            }
          >
            {tCommon("cancel")}
          </DialogClose>
          <Button type="button" className="min-w-32" onClick={handleNext}>
            {isLastStep ? t("createInvoice") : tCommon("next")}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <div className="flex flex-col gap-5">
          <CreateInvoiceStepper
            currentStep={step}
            onStepChange={handleStepChange}
            activeTooltip={stepTooltip}
            onActiveTooltipOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setStepTooltip(null);
              }
            }}
          />

          {step === 0 ? <CreateInvoiceRecipientStep form={form} /> : null}
          {step === 1 ? <CreateInvoiceItemsStep form={form} /> : null}
        </div>
      </Form>
    </ReusableDialog>
  );
}
