"use client";
import { useTranslations } from "next-intl";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TextEditor from "@/components/shared/TextEditor";
import { formStyles } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

type TextEditorFormEleProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  itemClassName?: string;
};

export default function TextEditorFormEle<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  optional,
  required,
  disabled,
  className,
  labelClassName,
  itemClassName,
}: TextEditorFormEleProps<T>) {
  const tCommon = useTranslations("common");
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(formStyles.item, "w-full min-w-0", itemClassName)}>
          {label ? (
            <FormLabel className={cn(formStyles.label, labelClassName)}>
              {label}
              {required ? <span className={formStyles.required}>*</span> : null}
              {optional ? (
                <span className={formStyles.optional}>{tCommon("optional")}</span>
              ) : null}
            </FormLabel>
          ) : null}
          <FormControl className="w-full min-w-0">
            <TextEditor
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              className={className}
            />
          </FormControl>
          <FormMessage className={formStyles.message} />
        </FormItem>
      )}
    />
  );
}
