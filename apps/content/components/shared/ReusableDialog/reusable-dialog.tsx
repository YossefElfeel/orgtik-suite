"use client";

import React from "react";
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
import { Loader, X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
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
  const hasActions = onSuccess || onCancel || footer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={`sm:rounded-2xl p-0 gap-0 ${SIZE_CLASSES[size]} max-h-[90vh] flex flex-col ${className}`}
      >
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <DialogHeader className="text-left p-0 space-y-2">
              <DialogTitle className="text-xl font-semibold">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
            {/* <DialogClose className="w-6 h-6 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </DialogClose> */}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 relative">{children}</div>

        {hasActions && (
          <DialogFooter className="p-6 pt-0 flex flex-row justify-end">
            {footer ? (
              footer
            ) : (
              <>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    {onCancelText || "Cancel"}
                  </Button>
                )}
                {onSuccess && (
                  <Button
                    type="button"
                    onClick={onSuccess}
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      onSuccessText || "Save"
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
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
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  open,
  onOpenChange,
  isLoading = false,
  variant = "default",
  children,
}: ConfirmDialogProps) {
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
              {cancelText}
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
              confirmText
            )}
          </Button>
        </>
      }
    >
      {children}
    </ReusableDialog>
  );
}
