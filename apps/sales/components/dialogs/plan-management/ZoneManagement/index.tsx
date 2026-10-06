"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import TextFormEle from "@/components/ui/form/text-form-element";
import ZoneCountryField from "@/components/dialogs/plan-management/ZoneManagement/ZoneCountryField";
import ZoneCurrencyField from "@/components/dialogs/plan-management/ZoneManagement/ZoneCurrencyField";
import ZoneLanguageFields from "@/components/dialogs/plan-management/ZoneManagement/ZoneLanguageFields";
import { zoneFormSchema, type ZoneFormValues } from "@/schemas/zones";
import {
  useCreateZoneMutation,
  useGetZonesQuery,
  useUpdateZoneMutation,
} from "@/redux/features/zones/zonesApi";
import type { ZoneCatalogCountry } from "@/types/zones";
import { useTranslations } from "next-intl";

const DEFAULT_LANGUAGE = "en";

const defaultValues: ZoneFormValues = {
  name: "",
  defaultCurrencyCode: "",
  countryCodes: [],
  defaultLanguageCode: DEFAULT_LANGUAGE,
  languageCodes: [DEFAULT_LANGUAGE],
};

type Props = {
  trigger: ReactElement;
  id?: string;
};

export default function ZoneManagement({ trigger, id }: Props) {
  const [open, setOpen] = useState(false);
  const [countryCatalog, setCountryCatalog] = useState<ZoneCatalogCountry[]>(
    [],
  );
  const isEdit = Boolean(id);
  const t = useTranslations("planManagement.zones");
  const tCommon = useTranslations("common");

  const [createZone, { isLoading: isCreating }] = useCreateZoneMutation();
  const [updateZone, { isLoading: isUpdating }] = useUpdateZoneMutation();
  const isSaving = isCreating || isUpdating;

  const { data: zonesRes, isFetching: isZoneLoading } = useGetZonesQuery(
    { page: 1, limit: 100 },
    { skip: !open || !id },
  );

  const editingZone = useMemo(
    () => zonesRes?.data.items.find((zone) => zone.id === id),
    [id, zonesRes?.data.items],
  );

  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues,
  });

  const handleCountriesLoaded = useCallback(
    (countries: ZoneCatalogCountry[]) => {
      setCountryCatalog((current) => {
        const countriesByCode = new Map(
          current.map((country) => [country.code, country]),
        );
        for (const country of countries) {
          countriesByCode.set(country.code, country);
        }
        return Array.from(countriesByCode.values());
      });
    },
    [],
  );

  useEffect(() => {
    if (!open) return;

    if (!id) {
      form.reset(defaultValues);
      return;
    }

    if (!editingZone) return;

    form.reset({
      name: editingZone.name,
      defaultCurrencyCode: editingZone.defaultCurrency.code,
      countryCodes: editingZone.countries.map((country) => country.code),
      defaultLanguageCode: editingZone.defaultLanguageCode,
      languageCodes: editingZone.languages.map((language) => language.code),
    });
  }, [open, id, editingZone, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
      setCountryCatalog([]);
    }
  };

  const handleSubmit = async (data: ZoneFormValues) => {
    if (isEdit && id) {
      await updateZone({ id, body: data }).unwrap();
    } else {
      await createZone(data).unwrap();
    }

    setOpen(false);
    form.reset(defaultValues);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={isEdit ? t("editZone") : t("addZone")}
      size="3xl"
      isLoading={isSaving || (isEdit && isZoneLoading)}
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
            disabled={isSaving || (isEdit && isZoneLoading)}
            onClick={() => {
              void form.handleSubmit(handleSubmit)();
            }}
          >
            {isEdit ? t("saveChanges") : t("addZone")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="space-y-4">
            <p className="text-12 font-medium text-muted-foreground">
              {t("basicInfo")}
            </p>

            <TextFormEle
              form={form}
              name="name"
              label={t("zoneName")}
              placeholder={t("zoneNamePlaceholder")}
            />

            <ZoneCountryField
              form={form}
              enabled={open}
              initialCountries={editingZone?.countries}
              onCountriesLoaded={handleCountriesLoaded}

            />

            <ZoneCurrencyField form={form} countries={countryCatalog} />
          </div>

          <ZoneLanguageFields form={form} enabled={open} />
        </form>
      </Form>
    </ReusableDialog>
  );
}
