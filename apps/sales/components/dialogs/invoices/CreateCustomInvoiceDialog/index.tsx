"use client";

import { useEffect, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import CreateCustomInvoiceStepper, {
  createCustomInvoiceSteps,
} from "@/components/dialogs/invoices/CreateCustomInvoiceDialog/CreateCustomInvoiceStepper";
import CreateCustomInvoiceDetailsStep from "@/components/dialogs/invoices/CreateCustomInvoiceDialog/CreateCustomInvoiceDetailsStep";
import CreateCustomInvoiceItemsStep from "@/components/dialogs/invoices/CreateCustomInvoiceDialog/CreateCustomInvoiceItemsStep";
import {
  buildCustomInvoicePayload,
  createEmptyCustomLineItem,
  mapCustomInvoiceToFormValues,
} from "@/lib/custom-invoice";
import {
  customInvoiceSchema,
  customInvoiceStepFields,
  type CustomInvoiceFormValues,
} from "@/schemas/custom-invoice";
import {
  useCreateCustomInvoiceMutation,
  useGetCustomInvoiceQuery,
  useUpdateCustomInvoiceMutation,
} from "@/redux/features/invoices/invoicesApi";
import { useTranslations } from "next-intl";
import type { PillTabsActiveTooltip } from "@/types/tabs";

type Props = {
  trigger: ReactElement;
  mode?: "create" | "edit";
  invoiceId?: string;
  onSuccess?: () => void;
};

function getDefaultValues(): CustomInvoiceFormValues {
  return {
    customerId: "",
    invoiceNumber: "",
    billingName: "",
    billingContactPerson: "",
    billingEmail: "",
    billingPhone: "",
    billingAddress: "",
    currency: "USD",
    dueDate: "",
    description: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    closingText: "",
    lineItems: [createEmptyCustomLineItem()],
    taxRate: 0,
    metadata: {
      projectReference: "",
      notes: "",
    },
  };
}

export default function CreateCustomInvoiceDialog({
  trigger,
  mode = "create",
  invoiceId,
  onSuccess,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [stepTooltip, setStepTooltip] = useState<PillTabsActiveTooltip | null>(
    null,
  );

  const isEditMode = mode === "edit" && Boolean(invoiceId);

  const { data: invoiceResponse, isFetching: isLoadingInvoice } =
    useGetCustomInvoiceQuery(
      { invoiceId: invoiceId ?? "" },
      { skip: !open || !isEditMode || !invoiceId },
    );

  const [createCustomInvoice, { isLoading: isCreating }] =
    useCreateCustomInvoiceMutation();
  const [updateCustomInvoice, { isLoading: isUpdating }] =
    useUpdateCustomInvoiceMutation();

  const form = useForm<CustomInvoiceFormValues>({
    resolver: zodResolver(customInvoiceSchema),
    defaultValues: getDefaultValues(),
    mode: "onSubmit",
  });

  const isLastStep = step === createCustomInvoiceSteps.length - 1;
  const isSubmitting = isCreating || isUpdating || form.formState.isSubmitting;

  const resetWizard = () => {
    setStep(0);
    setStepTooltip(null);
    form.reset(getDefaultValues());
  };

  useEffect(() => {
    if (!open || !isEditMode || !invoiceResponse?.data) return;
    form.reset(mapCustomInvoiceToFormValues(invoiceResponse.data));
  }, [form, invoiceResponse?.data, isEditMode, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetWizard();
    } else if (!isEditMode) {
      form.reset(getDefaultValues());
    }
  };

  const handleSubmit = async (values: CustomInvoiceFormValues) => {
    const payload = buildCustomInvoicePayload(values);

    if (isEditMode && invoiceId) {
      await updateCustomInvoice({ invoiceId, body: payload }).unwrap();
    } else {
      await createCustomInvoice(payload).unwrap();
    }

    onSuccess?.();
    handleOpenChange(false);
  };

  const handleNext = async () => {
    setStepTooltip(null);
    const fields = customInvoiceStepFields[step] ?? [];
    const valid = await form.trigger(fields);
    if (!valid) return;

    if (isLastStep) {
      void form.handleSubmit(handleSubmit)();
      return;
    }

    setStep((current) =>
      Math.min(current + 1, createCustomInvoiceSteps.length - 1),
    );
  };

  const handleStepChange = async (targetStep: number) => {
    setStepTooltip(null);

    if (targetStep === step) return;

    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    for (let stepIndex = 0; stepIndex < targetStep; stepIndex += 1) {
      const fields = customInvoiceStepFields[stepIndex] ?? [];
      const valid = await form.trigger(fields);

      if (!valid) {
        const incompleteStep = createCustomInvoiceSteps[stepIndex];
        const targetStepLabel = createCustomInvoiceSteps[targetStep]?.labelKey
          ? t(createCustomInvoiceSteps[targetStep].labelKey)
          : t("thatStep");

        setStep(stepIndex);
        setStepTooltip({
          tabId: createCustomInvoiceSteps[targetStep]?.id ?? "",
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
      title={isEditMode ? t("editCustomInvoice") : t("createCustomInvoice")}
      size="5xl"
      expandable
      showFooter
      isLoading={isEditMode && isLoadingInvoice}
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <DialogClose
            render={
              <Button type="button" variant="outline" onClick={resetWizard} />
            }
          >
            {tCommon("cancel")}
          </DialogClose>
          <Button
            type="button"
            className="min-w-32"
            disabled={isSubmitting || (isEditMode && isLoadingInvoice)}
            onClick={handleNext}
          >
            {isLastStep
              ? isEditMode
                ? tCommon("saveChanges")
                : t("createInvoice")
              : tCommon("next")}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <div className="flex flex-col gap-5">
          <CreateCustomInvoiceStepper
            currentStep={step}
            onStepChange={handleStepChange}
            activeTooltip={stepTooltip}
            onActiveTooltipOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setStepTooltip(null);
              }
            }}
          />

          {step === 0 ? <CreateCustomInvoiceDetailsStep form={form} /> : null}
          {step === 1 ? <CreateCustomInvoiceItemsStep form={form} /> : null}
        </div>
      </Form>
    </ReusableDialog>
  );
}
