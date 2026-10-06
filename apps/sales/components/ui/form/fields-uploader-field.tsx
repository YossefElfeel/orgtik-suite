"use client";
import { useTranslations } from "next-intl";

import { useRef, type ChangeEvent, type ReactNode } from "react";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";

interface FieldsUploaderFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  className?: string;
  labelClassName?: string;
  accept?: string;
  multiple?: boolean;
  optional?: boolean;
}

function FieldsUploaderField<T extends FieldValues>({
  form,
  name,
  label,
  className,
  labelClassName,
  accept,
  multiple = false,
  optional = false,
}: FieldsUploaderFieldProps<T>) {
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const rawValue = field.value as unknown;
        const files: File[] = !rawValue
          ? []
          : rawValue instanceof File
            ? [rawValue]
            : Array.isArray(rawValue)
              ? rawValue.filter(
                  (item: unknown): item is File => item instanceof File,
                )
              : [];

        const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
          const selectedFiles = event.target.files
            ? Array.from(event.target.files)
            : [];
          if (!selectedFiles.length) return;

          field.onChange(multiple ? selectedFiles : selectedFiles[0]);
          form.trigger(name);
        };

        const removeFile = (index?: number) => {
          if (multiple && index !== undefined) {
            const nextFiles = files.filter((_, i) => i !== index);
            field.onChange(nextFiles.length ? nextFiles : null);
          } else {
            field.onChange(null);
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          form.trigger(name);
        };

        return (
          <FormItem className={cn(formStyles.item, className)}>
            {label ? (
              <FormLabel className={cn(formStyles.label, labelClassName)}>
                {label}
                {optional ? (
                  <span className={formStyles.optional}>{tCommon("optional")}</span>
                ) : null}
              </FormLabel>
            ) : null}

            <FormControl>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple={multiple}
                  className="hidden"
                  onChange={handleFileChange}
                  onBlur={field.onBlur}
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`flex w-full cursor-pointer flex-col items-center justify-center 
                    gap-3 rounded-xl border border-dashed  min-h-37.5 px-6 py-8 transition-colors 
                    hover:border-primary/40 hover:bg-primary/5 ${
                      files.length > 0 && "border-solid"
                    }`}
                >
                  {files.length > 0 ? (
                    <ul className="flex w-full flex-col gap-2">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText className="size-4 shrink-0 text-secondary/80" />
                            <span className="truncate text-sm text-secondary">
                              {file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(multiple ? index : undefined);
                            }}
                            className="shrink-0 rounded-full p-1 text-secondary transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <div className="relative">
                        <FileText
                          className="size-10 text-secondary/80"
                          strokeWidth={1.5}
                        />
                        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary">
                          <Upload className="size-3 text-white" />
                        </span>
                      </div>
                      <p className="text-center text-sm text-secondary/80">
                        {tCommon("dropYourFilesHere")}{" "}
                        <span className="text-primary underline">
                          {tCommon("orClickToBrowse")}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default FieldsUploaderField;
