"use client";
import { CircleNotch as Loader, X } from "@phosphor-icons/react";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { triggerProps } from "@/lib/trigger";

const SIZE_CLASSES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  "6xl": "sm:max-w-6xl",
  "7xl": "sm:max-w-7xl",
};

interface ReusableDialogProps {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  size?: keyof typeof SIZE_CLASSES;
  onSuccessText?: string;
  onCancelText?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReusableDialog({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  className,
  size = "md",
  onSuccessText,
  onCancelText,
  onSuccess,
  onCancel,
  isLoading = false,
}: ReusableDialogProps) {
  const tCommon = useTranslations("common");
  const hasActions = onSuccess || onCancel || footer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger {...triggerProps(trigger)} />
      )}
      <DialogContent
        className={`sm:rounded-[12px] p-0 gap-0 ${SIZE_CLASSES[size]} max-h-[90vh] flex flex-col overflow-hidden ${className}`}
      >

        <div className="pt-6 px-6 pb-2 relative">
          <DialogHeader className="text-start p-0 gap-0">
            <DialogTitle className="text-2xl font-semibold text-gray-black">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-secondary ">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* الخط المنقط السفلي */}
          <div className="absolute bottom-0 start-6 end-6 border-b-[1px] border-dashed border-line" />
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {hasActions && (
          <DialogFooter className="flex flex-row justify-end relative">
            {footer ? (
              footer
            ) : (
              <>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    size={"lg"}
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    {onCancelText || tCommon("cancel")}
                  </Button>
                )}
                {onSuccess && (
                  <Button
                    type="button"
                    size={"lg"}
                    onClick={onSuccess}
                    disabled={isLoading}
                    className="min-w-[140px]"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      onSuccessText || tCommon("save")
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog >
  );
}

interface ConfirmDialogProps {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  variant?: "default" | "destructive";
  children?: React.ReactNode;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  open,
  onOpenChange,
  isLoading = false,
  variant = "default",
  children,
}: ConfirmDialogProps) {
  const tCommon = useTranslations("common");
  const resolvedConfirmText = confirmText ?? tCommon("confirm");
  const resolvedCancelText = cancelText ?? tCommon("cancel");

  return (
    <ReusableDialog
      title={title}
      description={description}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      footer={
        <>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {resolvedCancelText}
            </Button>
          )}
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              resolvedConfirmText
            )}
          </Button>
        </>
      }
    >
      {children}
    </ReusableDialog>
  );
}
