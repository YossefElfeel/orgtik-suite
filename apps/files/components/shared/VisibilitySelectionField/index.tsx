"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { RadioGroup } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";

interface VisibilitySelectionFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  name?: string;
  label?: string;
}

/** Who can open a folder: only me, everyone, or chosen people. Real radios: arrow keys, announced state. */
export function VisibilitySelectionField({ form, name = "access", label }: VisibilitySelectionFieldProps) {
  const t = useTranslations("CreateFolder");
  return (
    <RHFField
      control={form.control}
      name={name}
      label={label}
      render={(field) => (
        <RadioGroup
          aria-label={label}
          value={field.value}
          onValueChange={field.onChange}
          options={[
            { value: "only_me", label: t("onlyMe"), description: t("onlyMeDesc") },
            { value: "everyone", label: t("everyone"), description: t("everyoneDesc") },
            { value: "specific", label: t("specificPeople"), description: t("specificPeopleDesc") },
          ]}
        />
      )}
    />
  );
}
