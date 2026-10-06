"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import LocalizedDescriptionFields from "@/components/ui/form/LocalizedDescriptionFields";
import LocalizedNameFields from "@/components/ui/form/LocalizedNameFields";
import PackagePlansPicker from "@/components/dialogs/packages/PackageManagement/PackagePlansPicker";
import PackageZonePricing from "@/components/dialogs/packages/PackageManagement/PackageZonePricing";
import {
  createPackageDefaultValues,
  packageFormSchema,
  type PackageFormValues,
} from "@/schemas/packages";
import {
  useGetPackageByIdQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
} from "@/redux/features/packages/packagesApi";
import { useGetPlansQuery } from "@/redux/features/plans/plansApi";
import { useGetZonesQuery } from "@/redux/features/zones/zonesApi";
import { buildLocalizedPayload, mapLocalizedToForm } from "@/lib/form/localized-fields";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTranslations } from "next-intl";

const FORM_ID = "package-management-form";

type Props = {
  trigger: ReactElement;
  id?: string;
};

export default function PackageManagement({ trigger, id }: Props) {
  const displayText = useCatalogDisplayText();
  const t = useTranslations("packages");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(id);

  const { data: plansData, isLoading: isLoadingPlans } = useGetPlansQuery({
    limit: 100,
  });
  const { data: zonesData, isLoading: isLoadingZones } = useGetZonesQuery({
    limit: 100,
  });

  const planOptions = useMemo(() => {
    return (plansData?.data?.items || []).map((plan) => ({
      id: plan.id,
      name: displayText(plan.name),
      category:
        displayText(plan.category?.name) || t("uncategorized"),
      featureCount: plan.featureCount || 0,
    }));
  }, [displayText, plansData, t]);

  const { data: packageData, isFetching: isFetchingPackage } =
    useGetPackageByIdQuery(id!, {
      skip: !id || !open,
    });

  const [createPackage, { isLoading: isCreating }] = useCreatePackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdatePackageMutation();
  const isLoading = isLoadingPlans || isLoadingZones || isFetchingPackage;
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: createPackageDefaultValues(),
  });

  const selectedPlanIds = useWatch({
    control: form.control,
    name: "planIds",
  });

  const zonesValues = useWatch({
    control: form.control,
    name: "zones",
  });

  useEffect(() => {
    if (!open) return;
    if (isLoading) return;

    if (!id) {
      const defaultZones = (zonesData?.data?.items || []).map((zone) => ({
        zoneId: zone.id,
        isActive: true,
        price: 0,
      }));
      form.reset({ ...createPackageDefaultValues(), zones: defaultZones });
      return;
    }

    const pkg = packageData?.data;
    if (!pkg) return;

    form.reset({
      name: mapLocalizedToForm(pkg.name),
      description: mapLocalizedToForm(pkg.description),
      planIds: pkg.plans.map((plan) => plan.id),
      zones: (zonesData?.data?.items || []).map((zone) => {
        const existing = pkg.zones.find((item) => item.zoneId === zone.id);
        return {
          zoneId: zone.id,
          isActive: Boolean(existing),
          price: existing ? Number(existing.amount) : 0,
          countryOverrides:
            existing?.countryOverrides?.map((override) => ({
              countryCode: override.countryCode,
              price: Number(override.price),
            })) || [],
        };
      }),
    });
  }, [open, id, packageData, zonesData, isLoading, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(createPackageDefaultValues());
    }
  };

  const handleSubmit = async (data: PackageFormValues) => {
    const payloadZones = data.zones
      .filter((zone) => zone.isActive && zone.price !== null && zone.price !== undefined)
      .map((zone) => ({
        zoneId: zone.zoneId,
        price: String(zone.price),
        countryOverrides:
          zone.countryOverrides?.map((override) => ({
            countryCode: override.countryCode,
            price: String(override.price),
          })) || [],
      }));

    const body = {
      name: buildLocalizedPayload(data.name),
      description: buildLocalizedPayload(data.description),
      planIds: data.planIds,
      zones: payloadZones,
    };

    if (isEdit) {
      await updatePackage({ id: id!, body }).unwrap();
    } else {
      await createPackage(body).unwrap();
    }

    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={isEdit ? t("editPackage") : t("createBundle")}
      size="4xl"
      isLoading={isLoading}
      footer={
        <>
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline-primary"
                disabled={isSubmitting}
              />
            }
          >
            {tCommon("cancel")}
          </DialogClose>
          <Button
            type="submit"
            form={FORM_ID}
            className="min-w-32"
            disabled={isSubmitting}
          >
            {isEdit ? tCommon("saveChanges") : t("createBundle")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <LocalizedNameFields
            form={form}
            name="name"
            label={tCommon("name")}
            placeholder={t("namePlaceholder")}
          />

          <LocalizedDescriptionFields
            form={form}
            name="description"
            label={tCommon("description")}
            placeholder={t("descriptionPlaceholder")}
          />

          <PackagePlansPicker
            plans={planOptions}
            selectedIds={selectedPlanIds ?? []}
            onChange={(ids) =>
              form.setValue("planIds", ids, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={form.formState.errors.planIds?.message}
          />

          <PackageZonePricing
            availableZones={zonesData?.data?.items || []}
            values={zonesValues ?? []}
            onChange={(next) =>
              form.setValue("zones", next, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
