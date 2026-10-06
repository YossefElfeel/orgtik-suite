"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import TextFormEle from "@/components/ui/form/text-form-element";
import {
  durationFormSchema,
  type DurationFormValues,
} from "@/schemas/durations";
import {
  useCreateDurationMutation,
  useUpdateDurationMutation,
} from "@/redux/features/durations/durationsApi";
import {
  parseDurationPercentage,
  toDurationPercentage,
} from "@/lib/durations";
import type { Duration, DurationKind } from "@/types/durations";
import { useTranslations } from "next-intl";

const defaultValues: DurationFormValues = {
  months: "" as unknown as number,
  percentage: 0,
};

type Props = {
  trigger: ReactElement;
  kind: DurationKind;
  duration?: Duration;
};

export default function DurationManagement({
  trigger,
  kind,
  duration,
}: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(duration);
  const isPlan = kind === "plan";
  const t = useTranslations("planManagement.durations");
  const tCommon = useTranslations("common");
  const percentageLabel = isPlan ? t("columnDiscount") : t("columnDiscount");

  const [createDuration, { isLoading: isCreating }] =
    useCreateDurationMutation();
  const [updateDuration, { isLoading: isUpdating }] =
    useUpdateDurationMutation();
  const isSaving = isCreating || isUpdating;

  const form = useForm<DurationFormValues>({
    resolver: zodResolver(durationFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;

    if (!duration) {
      form.reset(defaultValues);
      return;
    }

    form.reset({
      months: duration.months,
      percentage: parseDurationPercentage(duration.percentage),
    });
  }, [open, duration, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (data: DurationFormValues) => {
    const body = {
      months: data.months,
      percentage: toDurationPercentage(data.percentage),
      isActive: duration?.isActive ?? true,
    };

    if (isEdit && duration) {
      await updateDuration({ id: duration.id, body }).unwrap();
    } else {
      await createDuration({ ...body, type: kind }).unwrap();
    }

    setOpen(false);
    form.reset(defaultValues);
  };

  const title = isEdit
    ? isPlan
      ? t("editPlanDuration")
      : t("editInstallmentDuration")
    : isPlan
      ? t("addPlanDuration")
      : t("addInstallmentDuration");

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={title}
      size="lg"
      isLoading={isSaving}
      footer={
        <>
          <DialogClose
            render={<Button type="button" variant="outline-primary" />}
          >
            {tCommon("cancel")}
          </DialogClose>
          <Button
            type="button"
            className="min-w-32"
            disabled={isSaving}
            onClick={() => {
              void form.handleSubmit(handleSubmit)();
            }}
          >
            {isEdit ? t("saveChanges") : t("addDuration")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          <TextFormEle
            form={form}
            name="months"
            type="number"
            label={t("durationMonths")}
            placeholder={t("durationMonthsPlaceholder")}
            allowEmptyNumber
          />
          <TextFormEle
            form={form}
            name="percentage"
            type="number"
            label={percentageLabel}
            placeholder={t("durationDiscountPlaceholder")}
            suffix="%"
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
