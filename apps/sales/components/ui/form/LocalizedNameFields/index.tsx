"use client";

import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import LocalizedTextFormEle from "@/components/ui/form/localized-text-form-element";
import type { CatalogLanguageOption } from "@/types/catalog-language";

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: string;
  languages?: CatalogLanguageOption[];
  label?: string;
  labelAddon?: ReactNode;
  placeholder?: string;
};

export default function LocalizedNameFields<T extends FieldValues>({
  form,
  name,
  languages,
  label,
  labelAddon,
  placeholder,
}: Props<T>) {
  return (
    <LocalizedTextFormEle
      form={form}
      name={name}
      label={label}
      labelAddon={labelAddon}
      placeholder={placeholder}
      languages={languages}
    />
  );
}
