"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { useGetZoneLanguagesQuery } from "@/redux/features/zones/zonesApi";
import { cn } from "@/lib/utils";
import type { ZoneLanguageFieldsProps } from "@/types/zones";

export default function ZoneLanguageFields({
  form,
  enabled,
}: ZoneLanguageFieldsProps) {
  const t = useTranslations("planManagement.zones");
  const [search, setSearch] = useState("");
  const selectedLanguages = useWatch({
    control: form.control,
    name: "languageCodes",
  });
  const defaultLanguageCode = useWatch({
    control: form.control,
    name: "defaultLanguageCode",
  });

  const { data: languagesResponse } = useGetZoneLanguagesQuery(
    { page: 1, limit: 20 },
    { skip: !enabled },
  );
  const { data: searchResponse, isFetching: isSearching } =
    useGetZoneLanguagesQuery(
      {
        page: 1,
        limit: 20,
        ...(search ? { search } : {}),
      },
      { skip: !enabled },
    );

  const languages = languagesResponse?.data.items ?? [];
  const searchResults = searchResponse?.data.items ?? [];

  useEffect(() => {
    if (!enabled) setSearch("");
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !defaultLanguageCode) return;

    const currentLanguages = form.getValues("languageCodes");
    if (!currentLanguages.includes(defaultLanguageCode)) {
      form.setValue(
        "languageCodes",
        [...currentLanguages, defaultLanguageCode],
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  }, [defaultLanguageCode, enabled, form]);

  const selectOptions = useMemo(() => {
    const options = new Map(
      searchResults.map((language) => [
        language.code,
        { value: language.code, label: language.name },
      ]),
    );
    const selectedDefault = languages.find(
      (language) => language.code === defaultLanguageCode,
    );

    if (selectedDefault) {
      options.set(selectedDefault.code, {
        value: selectedDefault.code,
        label: selectedDefault.name,
      });
    }

    return Array.from(options.values());
  }, [defaultLanguageCode, languages, searchResults]);

  const toggleLanguage = (languageCode: string) => {
    const currentLanguages = form.getValues("languageCodes");
    const isSelected = currentLanguages.includes(languageCode);

    if (isSelected) {
      if (languageCode === form.getValues("defaultLanguageCode")) return;
      form.setValue(
        "languageCodes",
        currentLanguages.filter((code) => code !== languageCode),
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }

    form.setValue("languageCodes", [...currentLanguages, languageCode], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon
          icon="solar:global-linear"
          className="size-4.5 text-secondary"
        />
        <p className="text-14 font-semibold text-foreground">{t("languages")}</p>
      </div>

      <div className="space-y-2">
        <ComboboxFormEle
          form={form}
          name="defaultLanguageCode"
          label={t("defaultLanguage")}
          placeholder={t("selectLanguage")}
          searchPlaceholder={t("searchLanguages")}
          options={selectOptions}
          onSearchChange={setSearch}
          isSearching={isSearching}
        />
        <p className="text-12 leading-5 text-muted-foreground">
          {t("languageHint")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {languages.map((language) => {
          const isSelected =
            selectedLanguages?.includes(language.code) ?? false;
          const isDefault = defaultLanguageCode === language.code;
          const label = language.nativeName
            ? `${language.name} (${language.nativeName})`
            : language.name;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => {
                if (isSelected && isDefault) return;
                toggleLanguage(language.code);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-12 font-semibold uppercase tracking-wide transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-secondary hover:bg-muted/50",
              )}
              aria-pressed={isSelected}
            >
              <span>{isSelected ? language.name : label}</span>
              {isSelected ? (
                <Icon
                  icon="solar:close-circle-linear"
                  className="size-3.5"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {form.formState.errors.languageCodes?.message ? (
        <p className="text-xs font-medium text-destructive">
          {form.formState.errors.languageCodes.message}
        </p>
      ) : null}
    </div>
  );
}
