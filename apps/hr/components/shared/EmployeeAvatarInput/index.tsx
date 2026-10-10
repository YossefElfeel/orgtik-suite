"use client";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { Camera, CircleNotch as Loader2, Trash as Trash2 } from "@phosphor-icons/react";

import React, { useRef } from "react";
import { Button } from "@orgtik/ui";
import CustomAvatar from "@/components/shared/CustomAvatar";
import {
  useGetEmployeeQuery,
  useUploadEmployeeAvatarMutation,
  useDeleteEmployeeAvatarMutation,
} from "@/redux/features/employee/employeeApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { useTranslations } from "next-intl";

interface EmployeeAvatarInputProps {
  id: string | number;
}

/**
 * EmployeeAvatarInput Component
 * Handles uploading and deleting employee avatars independently.
 * 
 * @param id - The ID of the employee
 */
export default function EmployeeAvatarInput({ id }: EmployeeAvatarInputProps) {
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employeeData, isLoading: isFetching } = useGetEmployeeQuery(id, { skip: !id });
  const [uploadAvatar, { isLoading: isUploading }] = useUploadEmployeeAvatarMutation();
  const [deleteAvatar, { isLoading: isDeleting }] = useDeleteEmployeeAvatarMutation();

  const avatarUrl = employeeData?.data?.personalInformation?.fullName ? employeeData?.data?.avatarUrl : undefined;
  // Note: Adjusting based on IEmployeeDetail structure observed in types
  // Actually, IEmployeeDetail might have avatarUrl if it's returned by the API
  // If not, we might need to check where it's stored.
  // Based on IEmployee, it's at the top level.

  const currentAvatarUrl = employeeData?.data?.avatarUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    await reqWithToaster(t("avatar.uploading"), async () => {
      await uploadAvatar({ id, body: formData }).unwrap();
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => deleteAvatar(id).unwrap();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const fullName = employeeData?.data?.personalInformation?.fullName || t("avatar.fallbackName");

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative group">
        <CustomAvatar
          src={currentAvatarUrl}
          className="w-28 h-28 text-3xl shadow-lg border-4 border-primary/10"
          alt={fullName}
          fallback={fullName.charAt(0)}
        />
        {(isUploading || isDeleting || isFetching) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-full transition-all">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleUploadClick}
          disabled={isUploading || isDeleting || isFetching}
          className="flex items-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Camera className="w-4 h-4 text-primary" />
          {currentAvatarUrl ? t("avatar.change") : t("avatar.upload")}
        </Button>
        {currentAvatarUrl && (
          <DeleteDialog
            title={t("avatar.deleteTitle")}
            description={t("avatar.deleteImpact")}
            confirmText={t("avatar.delete")}
            onConfirm={handleDelete}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading || isDeleting || isFetching}
                className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                {t("avatar.delete")}
              </Button>
            }
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        {t("steps.attachments.avatarHint")}
      </p>
    </div>
  );
}
