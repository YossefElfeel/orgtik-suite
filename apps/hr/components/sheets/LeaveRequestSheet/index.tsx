"use client";
import { useTranslations } from "next-intl";
import { X } from "@phosphor-icons/react";
import { Sheet, SheetTrigger, SheetContent, SheetClose, DialogTitle, IconButton } from "@orgtik/ui";
import { triggerProps } from "@/lib/trigger";
import type { LeaveRequestSheetProps } from "@/types/time-off";

export function LeaveRequestSheet({ open, onOpenChange, title, trigger, children, footer }: LeaveRequestSheetProps) {
  const t = useTranslations("common");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger {...triggerProps(trigger)} /> : null}
      <SheetContent hideClose className="[--sheet-width:560px]">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-5">
          <DialogTitle className="font-display text-title">{title}</DialogTitle>
          <SheetClose render={<IconButton label={t("close")} icon={<X />} size="sm" />} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <footer className="shrink-0 border-t border-line bg-raised px-6 py-4">{footer}</footer> : null}
      </SheetContent>
    </Sheet>
  );
}
