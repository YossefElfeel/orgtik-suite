"use client";

import * as React from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import CheckboxFormEle from "@/components/ui/form/checkbox-form-element";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import { cn } from "@/lib/utils";

import type { AddJobStepContentProps } from "../types";
import { useLocale, useTranslations } from "next-intl";

const yesNoOptions = [
  { value: "yes", labelKey: "common.yes" },
  { value: "no", labelKey: "common.no" },
];

const selectClassName =
  "h-10 w-full rounded-lg border-border px-3 text-base font-normal text-secondary shadow-[0px_1px_2px_0px_color-mix(in_oklab,var(--foreground)_10%,transparent)] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

export default function SalaryDetailsBenefitsStep({
  form,
}: AddJobStepContentProps) {
  const t = useTranslations("jobs");
  const locale = useLocale();
  const currencyOptions = React.useMemo(() => {
    const fallbackCodes = ["USD", "EUR", "GBP", "CHF"];
    const supportedCodes =
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("currency")
        : fallbackCodes;
    const deduplicated = Array.from(
      new Set(
        ["USD", ...supportedCodes]
          .map((code) => code.toUpperCase())
          .filter(Boolean),
      ),
    );
    const orderedCodes = [
      "USD",
      ...deduplicated.filter((code) => code !== "USD").sort(),
    ];
    const displayNames =
      typeof Intl.DisplayNames === "function"
        ? new Intl.DisplayNames([locale], { type: "currency" })
        : null;

    return [
      ...orderedCodes.map((code) => ({
        value: code,
        label: displayNames
          ? `${code} - ${displayNames.of(code) ?? code}`
          : code,
      })),
    ];
  }, [locale]);

  return (
    <div className="flex pb-6 flex-col gap-6">
      <h3 className="text-xl font-bold leading-6 text-foreground">
        {t("addJobSheet.sections.salaryDetails").toUpperCase()}
      </h3>

      <div className="flex w-full flex-col gap-1">
        <span className="text-base font-medium leading-5 text-foreground">
          {t("addJobSheet.fields.currencyType")}
        </span>
        <SelectFormEle
          form={form}
          name="currencyType"
          placeholder={t("addJobSheet.placeholders.selectCurrency")}
          options={currencyOptions}
          emptyOptionValue={SELECT_EMPTY_VALUE}
          className="gap-0"
          selectClassName={selectClassName}
        />
      </div>

      <div className="flex w-full flex-col gap-1">
        <span className="text-base font-medium leading-5 text-foreground">
          {t("addJobSheet.fields.salaryRange")}
        </span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextFormEle
            form={form}
            name="salaryRangeMin"
            type="number"
            placeholder="0"
            inputClassName="text-base text-secondary placeholder:text-secondary"
          />
          <TextFormEle
            form={form}
            name="salaryRangeMax"
            type="number"
            placeholder="0"
            inputClassName="text-base text-secondary placeholder:text-secondary"
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <header className="space-y-1">
          <h3 className="text-lg font-medium leading-6 text-foreground">
            {t("addJobSheet.fields.accommodationType")}
          </h3>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("addJobSheet.accommodationHelp")}
          </p>
        </header>

        <FormField
          control={form.control}
          name="accommodationType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 gap-2 md:grid-cols-2"
                >
                  {[
                    {
                      value: "company",
                      label: t("addJobSheet.options.accommodation.company"),
                      description: t("addJobSheet.options.accommodation.companyDescription"),
                    },
                    {
                      value: "allowance",
                      label: t("addJobSheet.options.accommodation.allowance"),
                      description: t("addJobSheet.options.accommodation.allowanceDescription"),
                    },
                    {
                      value: "own",
                      label: t("addJobSheet.options.accommodation.own"),
                      description: t("addJobSheet.options.accommodation.ownDescription"),
                    },
                  ].map((option) => {
                    const isSelected = field.value === option.value;

                    return (
                      <div
                        key={option.value}
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "relative flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-border/80",
                        )}
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                          checked={isSelected}
                          className={cn(
                            "mt-0.5 size-5 border-[1.5px]",
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {option.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <h3 className="text-xl font-bold leading-6 text-foreground">
        {t("addJobSheet.sections.benefits").toUpperCase()}
      </h3>

      <CheckboxFormEle
        form={form}
        name="bonusAvailability"
        label={t("addJobSheet.fields.bonusAvailability")}
        options={yesNoOptions.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        orientation="horizontal"
        className="gap-4"
        labelClassName="text-base font-medium leading-5 text-foreground"
        checkboxGroupClassName="flex gap-10"
      />

      <CheckboxFormEle
        form={form}
        name="healthInsurance"
        label={t("addJobSheet.fields.healthInsurance")}
        options={yesNoOptions.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        orientation="horizontal"
        className="gap-4"
        labelClassName="text-base font-medium leading-5 text-foreground"
        checkboxGroupClassName="flex gap-10"
      />

      <CheckboxFormEle
        form={form}
        name="paidTimeOff"
        label={t("addJobSheet.fields.paidTimeOff")}
        options={yesNoOptions.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        orientation="horizontal"
        className="gap-4"
        labelClassName="text-base font-medium leading-5 text-foreground"
        checkboxGroupClassName="flex gap-10"
      />
    </div>
  );
}
