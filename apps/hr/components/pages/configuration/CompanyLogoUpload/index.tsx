"use client";
import { Camera as CameraIcon, UploadSimple as UploadSimpleIcon, X } from "@phosphor-icons/react";

import React, { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface CompanyLogoUploadProps {
  value?: string | null;
  onChange: (value: File | string | null) => void;
}

const CompanyLogoUpload: React.FC<CompanyLogoUploadProps> = ({ value, onChange }) => {
  const t = useTranslations("configuration");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  React.useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onChange(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="size-32 border-2 border-dashed border-muted-foreground/20">
          {preview ? (
            <img
              src={preview}
              alt={t("companyLogo")}
              className="aspect-square size-full rounded-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-muted">
              <CameraIcon  className="size-10 text-muted-foreground" weight="fill" aria-hidden="true" />
            </AvatarFallback>
          )}
        </Avatar>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t("removeLogo")}
            title={t("removeLogo")}
            className="absolute top-2 end-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="text-white size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadSimpleIcon  className="me-2 size-4" weight="bold" aria-hidden="true" />
          {t("uploadLogo")}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default CompanyLogoUpload;
