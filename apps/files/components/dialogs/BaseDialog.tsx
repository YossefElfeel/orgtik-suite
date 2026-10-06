"use client";

// Every Files dialog's frame, on @orgtik/ui (Files wave, FS-FILES-1). The API is the one the
// dialogs already use, so they keep working; what changes is underneath: the library's Dialog
// (Base UI, like the menus that open these dialogs, so overlays never mix primitive libraries),
// its sizes, its footer order, and a busy submit button instead of an English "Submitting...".
import React, { forwardRef, isValidElement, useImperativeHandle, useState, type ReactElement } from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@orgtik/ui";
import { cn } from "@/lib/utils";

// The old sizes, onto the library's four.
const SIZES = { sm: "sm", md: "md", lg: "lg", xl: "xl", "2xl": "xl", "3xl": "xl", "5xl": "xl", "6xl": "xl", full: "xl" } as const;
export type BaseDialogSize = keyof typeof SIZES;

export interface BaseDialogRef {
  close: () => void;
}

export interface BaseDialogProps {
  /** The element that opens the dialog (uncontrolled use). */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  isCloseBtn?: boolean;
  onSubmit?: () => void | Promise<void | boolean>;
  onCancel?: () => void;
  /** Return false to prevent closing (e.g. show a confirmation step). */
  onBeforeClose?: () => boolean;
  submitText?: string;
  cancelText?: string;
  size?: BaseDialogSize;
  content: React.ReactNode;
  contentClassName?: string;
  /** Classes on the body around `content`. */
  bodyClassName?: string;
  /** The old variant names, onto the library's. */
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Keep the submit button off until the form can be sent. */
  submitDisabled?: boolean;
}

const VARIANT = { default: "primary", destructive: "danger", outline: "secondary", secondary: "secondary", ghost: "ghost", link: "ghost" } as const;

export const BaseDialog = forwardRef<BaseDialogRef, BaseDialogProps>(function BaseDialog(
  {
    children,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    title,
    description,
    isCloseBtn = true,
    onSubmit,
    onCancel,
    onBeforeClose,
    submitText,
    cancelText,
    size = "lg",
    content,
    contentClassName,
    bodyClassName,
    submitVariant = "default",
    submitDisabled,
  },
  ref,
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (next: boolean) => controlledOnOpenChange?.(next) : setInternalOpen;

  useImperativeHandle(ref, () => ({ close: () => setOpen(false) }), [isControlled]);

  async function handleSubmit() {
    if (!onSubmit) return;
    setSubmitting(true);
    try {
      const result = await Promise.resolve(onSubmit());
      if (result !== false) setOpen(false);
    } catch {
      // A rejected submit (an invalid form, a failed request) keeps the dialog open; the form or
      // the request's own toast says why.
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next && onBeforeClose?.() === false) return;
    setOpen(next);
    if (!next) onCancel?.();
  }

  const showFooter = submitText != null || (cancelText != null && cancelText !== "");
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && isValidElement(children) ? <DialogTrigger render={children as ReactElement<Record<string, unknown>>} /> : null}
      <DialogContent size={SIZES[size]} hideClose={!isCloseBtn} className={contentClassName}>
        <DialogHeader>
          <DialogTitle className="line-clamp-2 break-words">{title}</DialogTitle>
          {description ? <DialogDescription className="break-words">{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody className={cn("text-start", bodyClassName)}>{content}</DialogBody>
        {showFooter ? (
          <DialogFooter>
            {cancelText ? (
              <Button
                variant="ghost"
                disabled={submitting}
                onClick={() => {
                  onCancel?.();
                  setOpen(false);
                }}
              >
                {cancelText}
              </Button>
            ) : null}
            {submitText ? (
              <Button variant={VARIANT[submitVariant]} onClick={handleSubmit} loading={submitting} disabled={submitDisabled}>
                {submitText}
              </Button>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
});

BaseDialog.displayName = "BaseDialog";
