"use client";
import { FolderOpen, UploadSimple as Upload } from "@phosphor-icons/react";

import React, { useEffect, useMemo, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { formStyles } from "@/lib/form-styles";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface LogoUploadFieldProps {
  name: string;
  label?: string;
  multiple?: boolean;
  /** Overrides for the drop area's words; the defaults come from the "uploadField" catalog. */
  title?: string;
  changeTitle?: string;
  hint?: string;
  buttonLabel?: string;
}

const MAX_SIZE_MB = 20;

function LogoUploadField({ name, label, multiple = false, title, changeTitle, hint, buttonLabel }: LogoUploadFieldProps) {
  const t = useTranslations("uploadField");
  const { control, watch } = useFormContext();
  const fieldValue = watch(name);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const files = useMemo(() => {
    if (!fieldValue) return [] as File[];
    if (fieldValue instanceof File) return [fieldValue];
    if (Array.isArray(fieldValue)) {
      return fieldValue.filter((item): item is File => item instanceof File);
    }
    return [] as File[];
  }, [fieldValue]);

  const preview = useMemo(() => {
    if (typeof fieldValue === "string") return fieldValue;
    const firstFile = files[0];
    if (firstFile) return URL.createObjectURL(firstFile);
    return "";
  }, [fieldValue]);

  useEffect(() => {
    if (!preview || typeof fieldValue === "string") return;
    const url = preview;
    return () => URL.revokeObjectURL(url);
  }, [fieldValue, preview, files]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File | File[] | null) => void
  ) => {
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    if (!selectedFiles.length) {
      onChange(null);
      return;
    }
    onChange(multiple ? selectedFiles : selectedFiles[0]);
  };

  const hasLogo = files.length > 0 || Boolean(preview);

  return (
    <div className="space-y-3">
      <label
        htmlFor={name}
        className={cn(
          formStyles.label,
          "text-start peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        )}
      >
        {label}
      </label>

      <Controller
        name={name}
        control={control}
        render={({ field: { onChange } }) => (
          <>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              className="hidden"
              onChange={(event) => handleFileChange(event, onChange)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-primary bg-background px-6 py-6 transition-colors hover:bg-accent/20"
            >
              <div className="grid size-[74px] place-items-center rounded-full bg-background shadow-[0_8px_16px_rgba(0,0,0,0.09)]">
                <FolderOpen className="size-9 text-primary" />
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-center text-lg font-medium leading-6 text-foreground">
                  {hasLogo ? (changeTitle ?? t("changeTitle")) : (title ?? t("title"))}
                </span>
                <span className="text-sm leading-[18px] text-muted-foreground">
                  {hint ?? t("maxSize", { size: MAX_SIZE_MB })}
                </span>
              </div>

              <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-[0_1px_2px_rgba(9,25,72,0.06)]">
                <Upload className="size-4" />
                {buttonLabel ?? t("button")}
              </span>
            </button>
          </>
        )}
      />

      {preview && (
        <div className="flex items-center gap-4 rounded-lg border border-input bg-background p-3 shadow-[0_1px_2px_rgba(37,40,45,0.1)]">
          <Image
            src={preview}
            alt={t("previewAlt")}
            width={56}
            height={56}
            className="rounded-lg border border-input bg-background object-contain"
            unoptimized
          />

        </div>
      )}
      {multiple && files.length > 0 && (
        <div className="space-y-1 rounded-lg border border-input bg-background p-3 text-sm text-muted-foreground shadow-[0_1px_2px_rgba(37,40,45,0.1)]">
          {files.map((file) => (
            <p key={`${file.name}-${file.lastModified}`} className="truncate">
              <bdi>{file.name}</bdi>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default LogoUploadField;

