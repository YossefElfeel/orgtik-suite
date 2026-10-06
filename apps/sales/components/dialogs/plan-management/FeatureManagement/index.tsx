"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import TextFormEle from "@/components/ui/form/text-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import SwitchFormEle from "@/components/ui/form/switch-form-element";
import LocalizedDescriptionFields from "@/components/ui/form/LocalizedDescriptionFields";
import LocalizedNameFields from "@/components/ui/form/LocalizedNameFields";
import { CategorySelectField } from "@/components/shared/EntitySelectFields";
import FeatureZonePricing from "@/components/dialogs/plan-management/FeatureZonePricing";
import {
  createFeatureDefaultValues,
  featureFormSchema,
  toCreateFeatureDTO,
  toFeatureFormValues,
  type FeatureFormValues,
} from "@/schemas/features";
import {
  useCreateFeatureMutation,
  useGetFeatureQuery,
  useUpdateFeatureMutation,
} from "@/redux/features/features/featuresApi";
import { useGetZonesQuery } from "@/redux/features/zones/zonesApi";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id?: string;
};

export default function FeatureManagement({ trigger, id }: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(id);
  const t = useTranslations("planManagement.features");
  const tCommon = useTranslations("common");

  const featureVisibilityOptions = useMemo(
    () => [
      { value: "public", label: tCommon("public") },
      { value: "internal", label: tCommon("internal") },
    ],
    [tCommon],
  );

  const featurePaymentTypeOptions = useMemo(
    () => [
      { value: "full_payment", label: tCommon("fullPayment") },
      { value: "installment", label: tCommon("installment") },
    ],
    [tCommon],
  );

  const [createFeature, { isLoading: isCreating }] = useCreateFeatureMutation();
  const [updateFeature, { isLoading: isUpdating }] = useUpdateFeatureMutation();
  const isSaving = isCreating || isUpdating;

  const { data: zonesResponse, isFetching: isZonesLoading } = useGetZonesQuery(
    { page: 1, limit: 100 },
    { skip: !open },
  );
  const availableZones = useMemo(
    () => zonesResponse?.data.items ?? [],
    [zonesResponse?.data.items],
  );

  const { data: featureResponse, isFetching: isFeatureLoading } =
    useGetFeatureQuery(
      { id: id! },
      { skip: !open || !id },
    );

  // Edit forms must use native `data`, never `display`.
  const editingFeature = featureResponse?.data;

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: createFeatureDefaultValues(),
  });

  useEffect(() => {
    if (!open) return;
    if (availableZones.length === 0 && !zonesResponse) return;

    if (!id) {
      form.reset(createFeatureDefaultValues(availableZones));
      return;
    }

    if (!editingFeature) return;

    form.reset(toFeatureFormValues(editingFeature, availableZones));
  }, [open, id, editingFeature, availableZones, zonesResponse, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(createFeatureDefaultValues());
    }
  };

  const handleSubmit = async (data: FeatureFormValues) => {
    const body = toCreateFeatureDTO(data);

    if (isEdit && id) {
      await updateFeature({ id, body }).unwrap();
    } else {
      await createFeature(body).unwrap();
    }

    setOpen(false);
    form.reset(createFeatureDefaultValues());
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={isEdit ? t("editFeature") : t("addFeature")}
      description={t("featureDesc")}
      size="3xl"
      isLoading={
        isSaving ||
        isZonesLoading ||
        (isEdit && isFeatureLoading)
      }
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
            {isEdit ? t("saveChanges") : t("addFeature")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <LocalizedNameFields
            form={form}
            name="name"
            label={t("featureName")}
            placeholder={t("featureNamePlaceholder")}
          />

          <LocalizedDescriptionFields
            form={form}
            name="description"
            label={tCommon("description")}
            placeholder={t("featureDescriptionPlaceholder")}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <CategorySelectField
              form={form}
              name="categoryId"
              enabled={open}
              label={tCommon("category")}
              placeholder={tCommon("selectCategory")}
            />
            <TextFormEle
              form={form}
              name="price"
              type="number"
              label={t("priceUsd")}
              placeholder="0"
              suffix="$"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ComboboxFormEle
              form={form}
              name="visibility"
              label={tCommon("visibility")}
              placeholder={tCommon("selectVisibility")}
              options={featureVisibilityOptions}
            />
            <ComboboxFormEle
              form={form}
              name="paymentType"
              label={t("paymentType")}
              placeholder={tCommon("selectPaymentType")}
              options={featurePaymentTypeOptions}
            />
          </div>

          <SwitchFormEle
            form={form}
            name="isActive"
            label={tCommon("active")}
            description={t("inactiveFeatureDesc")}
          />

          <FeatureZonePricing form={form} availableZones={availableZones} />
        </form>
      </Form>
    </ReusableDialog>
  );
}
