"use client";

import React, { useState } from "react";
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
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  children?: React.ReactNode;
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
  successVariant?: React.ComponentProps<typeof Button>["variant"];
  successClassName?: string;
  showFooter?: boolean;
  /** Shows an expand control in the header to toggle full-screen dialog mode. */
  expandable?: boolean;
  /** Called when expandable full-screen mode toggles. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Elevates stacking above an already-open dialog. */
  nested?: boolean;
}

function renderDialogTrigger(trigger: React.ReactNode) {
  if (React.isValidElement(trigger) && trigger.type === Button) {
    const { children, ...buttonProps } = trigger.props as React.ComponentProps<
      typeof Button
    > & { children?: React.ReactNode };

    return (
      <DialogTrigger render={<Button {...buttonProps} />}>
        {children}
      </DialogTrigger>
    );
  }

  if (React.isValidElement(trigger)) {
    return <DialogTrigger render={trigger} />;
  }

  return <DialogTrigger render={<Button />}>{trigger}</DialogTrigger>;
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
  successVariant = "default",
  successClassName,
  showFooter = true,
  expandable = false,
  onExpandedChange,
  nested = false,
}: ReusableDialogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("common");

  const handleCancel = () => {
    onCancel?.();
  };

  const setExpanded = (nextExpanded: boolean) => {
    setIsExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setExpanded(false);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && renderDialogTrigger(trigger)}
      <DialogContent
        nested={nested}
        className={cn(
          "gap-0 overflow-hidden p-0 flex flex-col",
          isExpanded
            ? "fixed inset-0 top-0 left-0 h-screen w-screen max-h-screen max-w-none translate-x-0 translate-y-0 rounded-none sm:max-w-none sm:rounded-none"
            : cn("sm:rounded-xl max-h-[90vh]", SIZE_CLASSES[size]),
          className,
        )}
      >
        <div className="relative px-5 pt-5 pb-2">
          {expandable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 end-12 z-10"
              icon={
                isExpanded
                  ? "solar:minimize-square-linear"
                  : "solar:full-screen-linear"
              }
              onClick={() => setExpanded(!isExpanded)}
              aria-label={
                isExpanded ? t("exitFullScreen") : t("expandFullScreen")
              }
            />
          ) : null}
          <DialogHeader className="gap-0 p-0">
            <DialogTitle className="text-2xl font-semibold">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {children != null && children !== false && (
          <div className="p-5 overflow-y-auto flex-1 ">{children}</div>
        )}

        {showFooter && (
          <div className="flex flex-wrap gap-2 flex-row justify-end  relative p-4 border-t border-border shadow-[0_-8px_20px_0_rgba(0,0,0,0.08)]">
            {footer ? (
              footer
            ) : (
              <>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={handleCancel}
                    />
                  }
                >
                  {onCancelText || t("cancel")}
                </DialogClose>
                {onSuccess && (
                  <Button
                    type="button"
                    variant={successVariant}
                    onClick={onSuccess}
                    disabled={isLoading}
                    className={successClassName ?? "min-w-32"}
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      onSuccessText || t("save")
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
