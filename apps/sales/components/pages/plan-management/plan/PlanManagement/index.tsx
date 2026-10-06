"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Loader2, PlusIcon } from "lucide-react";
import { Form } from "@/components/ui/form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import {
  createPlanDefaultValues,
  planFormSchema,
  planStepFields,
  toCreatePlanDTO,
  toPlanFormValues,
  type PlanFormValues,
} from "@/schemas/plans";
import { getFirstErrorPath } from "@/lib/form/get-first-error-path";
import {
  LocalizedValidationFocusProvider,
  requestLocalizedErrorFocus,
} from "@/components/ui/form/LocalizedValidationFocus";
import { planFormSteps } from "./constants";
import { PlanFormStepper } from "./PlanFormStepper";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { FeaturesDurationsStep } from "./steps/FeaturesDurationsStep";
import { ZonePricingStep } from "./steps/ZonePricingStep";
import { CommissionsStep } from "./steps/CommissionsStep";
import {
  useCreatePlanMutation,
  useGetPlanQuery,
  useUpdatePlanMutation,
} from "@/redux/features/plans/plansApi";
import { useGetDurationsQuery } from "@/redux/features/durations/durationsApi";
import { useGetZonesListQuery } from "@/redux/features/zones/zonesApi";
import type { PlanDto } from "@/types/plans";
import { useTranslations } from "next-intl";

type Props = {
  onSubmit?: (data: PlanFormValues) => void;
  planId?: string;
  initialPlan?: PlanDto;
  trigger?: React.ReactNode;
};

export function PlanManagement({ onSubmit, planId, initialPlan, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [createPlan, { isLoading }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const isEditMode = Boolean(planId);
  const t = useTranslations("planManagement.actions");

  const { data: durationsResponse } = useGetDurationsQuery(undefined, {
    skip: !open,
  });
  const { data: zonesResponse } = useGetZonesListQuery(undefined, {
    skip: !open,
  });
  const { data: planResponse, isFetching: isFetchingPlan } = useGetPlanQuery(
    { id: planId! },
    {
      skip: !open || !isEditMode || Boolean(initialPlan),
    },
  );

  const defaultPlanDurationIds = useMemo(
    () =>
      (durationsResponse?.data.items ?? [])
        .filter((duration) => duration.type === "plan" && duration.months === 12)
        .map((duration) => duration.id)
        .slice(0, 1),
    [durationsResponse?.data.items],
  );

  const planData = initialPlan ?? planResponse?.data;
  const defaultValues = useMemo<PlanFormValues>(
    () => {
      const availableZones = zonesResponse?.data.items ?? [];

      if (isEditMode && planData) {
        return toPlanFormValues(planData, availableZones, defaultPlanDurationIds);
      }

      return createPlanDefaultValues(availableZones, defaultPlanDurationIds);
    },
    [defaultPlanDurationIds, isEditMode, planData, zonesResponse?.data.items],
  );

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const isLastStep = step === planFormSteps.length - 1;

  const resetWizard = () => {
    setStep(0);
    form.reset(defaultValues);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetWizard();
    }
  };

  const handleSubmit = async (data: PlanFormValues) => {
    onSubmit?.(data);
    const payload = toCreatePlanDTO(data);

    if (planId) {
      await updatePlan({ id: planId, body: payload }).unwrap();
    } else {
      await createPlan(payload).unwrap();
    }

    setOpen(false);
    resetWizard();
  };

  const handleNext = async () => {
    const fields = planStepFields[step] ?? [];
    const valid = await form.trigger(fields as Parameters<typeof form.trigger>[0]);
    if (!valid) {
      // Wait for RHF error state to commit so each localized field can jump
      // to its invalid language tab (e.g. description.ar).
      queueMicrotask(() => {
        requestLocalizedErrorFocus();
        const errorPath = getFirstErrorPath(form.formState.errors);
        if (errorPath) {
          requestAnimationFrame(() => {
            void form.setFocus(errorPath as Path<PlanFormValues>);
          });
        }
      });
      return;
    }

    if (isLastStep) {
      form.handleSubmit(handleSubmit)();
      return;
    }

    setStep((current) => Math.min(current + 1, planFormSteps.length - 1));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const submitLoading = isLoading || isUpdating;
  const isFormBootstrapping =
    open &&
    Boolean(zonesResponse == null || durationsResponse == null) &&
    !(
      isEditMode &&
      !initialPlan &&
      planResponse == null &&
      !isFetchingPlan
    );
  const showLoadingState = open && (isFetchingPlan || isFormBootstrapping);
  const dialogTitle = isEditMode ? t("editPlan") : t("addNewPlan");
  const submitLabel = isLastStep
    ? isEditMode
      ? t("updatePlan")
      : t("createPlan")
    : t("next");

  return (
    <LocalizedValidationFocusProvider>
      <ReusableDialog
        open={open}
        onOpenChange={handleOpenChange}
        trigger={
          trigger ?? (
            <Button>
              <PlusIcon />
              {t("newPlan")}
            </Button>
          )
        }
        title={dialogTitle}
        size="4xl"
        showFooter
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div>
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  {t("back")}
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DialogClose
                render={
                  <Button type="button" variant="outline" onClick={resetWizard} />
                }
              >
                {t("cancel")}
              </DialogClose>
              <Button
                type="button"
                className="min-w-32"
                onClick={handleNext}
                disabled={submitLoading || showLoadingState}
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        }
      >
        {showLoadingState ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-secondary" />
          </div>
        ) : (
          <Form {...form}>
            <form
              id="plan-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-5"
            >
              <PlanFormStepper currentStep={step} />

              {step === 0 ? <BasicInfoStep form={form} enabled={open} /> : null}
              {step === 1 ? (
                <FeaturesDurationsStep form={form} enabled={open} />
              ) : null}
              {step === 2 ? <ZonePricingStep form={form} enabled={open} /> : null}
              {step === 3 ? <CommissionsStep form={form} /> : null}
            </form>
          </Form>
        )}
      </ReusableDialog>
    </LocalizedValidationFocusProvider>
  );
}
