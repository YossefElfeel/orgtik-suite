"use client";

import type { FieldValues, UseFormReturn } from "react-hook-form";

import LocalizedTextFormEle from "@/components/ui/form/localized-text-form-element";
import type { CatalogLanguageOption } from "@/types/catalog-language";

type Props<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: string;
  languages?: CatalogLanguageOption[];
  label?: string;
  placeholder?: string;
};

export default function LocalizedDescriptionFields<T extends FieldValues>({
  form,
  name,
  languages,
  label,
  placeholder,
}: Props<T>) {
  return (
    <LocalizedTextFormEle
      form={form}
      name={name}
      label={label}
      placeholder={placeholder}
      type="textarea"
      languages={languages}
    />
  );
}
