"use client";
import { Check, X as XIcon } from "@phosphor-icons/react";
import { Button } from "@orgtik/ui";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@orgtik/ui";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
export type SuccessDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Shown to screen readers (DialogTitle). */
    title: string;
    message: string;
    primaryLabel: string;
    /** Runs before the dialog closes (e.g. reset parent state). */
    onPrimaryAction?: () => void;
    /** Override default content width classes. */
    className?: string;
    showCloseButton?: boolean;
};
/**
 * Centered success confirmation with icon, message, and single primary action.
 * Pass translated strings from the parent (`useTranslations`).
 */
export function SuccessDialog({ open, onOpenChange, title, message, primaryLabel, onPrimaryAction, className = "max-w-[380px] p-0 overflow-hidden border border-line bg-raised shadow-[0_16px_44px_rgba(37,40,45,0.14)]", showCloseButton = false, }: SuccessDialogProps) {
    const tCommon = useTranslations("common");
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} hideClose={!showCloseButton}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative flex flex-col items-center bg-sunken px-8 pb-6 pt-14 text-center">
          <DialogClose render={<button type="button" className="absolute end-4 top-4 grid size-10 place-items-center rounded-full border border-line bg-raised text-fg-muted shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition hover:bg-sunken"/>}>
            <XIcon className="size-4"/>
            <span className="sr-only">{tCommon("close")}</span>
          </DialogClose>

          <div className="mb-6 grid size-[88px] place-items-center rounded-full bg-success-solid text-white">
            <Check className="size-12" strokeWidth={3}/>
          </div>
          <p className="text-[16px] font-semibold leading-snug text-fg">
            {message}
          </p>
        </div>
        <DialogFooter className={cn("border-0 bg-raised px-6 pb-6 pt-4")}>
          <Button size="lg" className="w-full h-14" onClick={() => {
            onPrimaryAction?.();
            onOpenChange(false);
        }}>
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
