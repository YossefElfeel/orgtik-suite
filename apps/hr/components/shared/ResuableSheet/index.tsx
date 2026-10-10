"use client";
import { Button } from "@orgtik/ui";
import { Sheet, SheetContent, DialogDescription as SheetDescription, DialogFooter as SheetFooter, DialogHeader as SheetHeader, DialogTitle as SheetTitle, SheetTrigger } from "@orgtik/ui";
import { cn } from "@/lib/utils";
import React from "react";
import { useTranslations } from "next-intl";
import { triggerProps } from "@/lib/trigger";
interface ReusableSheetProps {
    trigger?: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    side?: "bottom" | "right";
    onBack?: () => void;
    footer?: React.ReactNode;
    variant?: "default" | "floating";
    // إضافة prop الحجم
    size?: "sm" | "md" | "lg" | "xl" | "full";
}
export default function ReusableSheet({ trigger, title, description, children, open, onOpenChange, className = "", side = "right", onBack, footer, variant = "floating", size = "md", }: ReusableSheetProps) {
    const tCommon = useTranslations("common");
    const isFloating = variant === "floating";
    const sizeStyles = {
        sm: "!max-w-none sm:!max-w-sm w-full",
        md: "!max-w-none sm:!max-w-md w-full",
        lg: "!max-w-none sm:!max-w-lg w-full",
        xl: "!max-w-none sm:!max-w-xl w-full",
        full: "!max-w-none !w-screen h-full",
    };
    const sideStyles = {
        bottom: isFloating
            ? "rounded-[20px] !start-2 !end-2 bottom-0 !max-h-[90vh]"
            : "rounded-t-[20px] start-0 end-0 bottom-0 max-h-[90vh]",
        right: isFloating
            ? cn("rounded-[16px] !top-2 !bottom-2 !end-2 h-[calc(100%-1rem)]", sizeStyles[size])
            : cn("rounded-[20px] top-0 bottom-0 end-0 h-full", sizeStyles[size]),
    };
    return (<Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger {...triggerProps(trigger ? trigger : <Button>{tCommon("open")}</Button>)}/>

      <SheetContent side={side === 'right' ? 'end' : side} className={cn("fixed flex flex-col outline-none overflow-hidden bg-raised shadow-xl transition-all", sideStyles[side], className, isFloating ? "p-6 pb-0" : "p-0")}>
        {/* Header */}
        <SheetHeader className={cn("bg-raised border-b border-line w-full", isFloating ? "p-0 pb-5" : "p-5")}>
          <div className="flex items-center gap-4">
            <div className="text-start">
              <SheetTitle className="text-2xl font-semibold">
                {title}
              </SheetTitle>
              {description && (<SheetDescription className="text-sm text-fg-subtle">
                  {description}
                </SheetDescription>)}
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className={cn("flex-1 overflow-y-auto pt-1 bg-raised", isFloating ? "" : "p-6 pt-0")}>
          {children}
        </div>

        {/* Gradient shadow for bottom side only */}
        {side === "bottom" && (<div className="absolute bottom-[100%] start-0 w-full h-10 bg-gradient-to-t from-black/5 pointer-events-none to-transparent"></div>)}

        {/* Footer */}
        {footer && (<SheetFooter className={cn("bg-sunken border-t border-line mt-auto", isFloating ? "" : "p-6")}>
            <div className="w-full flex justify-end items-center gap-3">
              {footer}
            </div>
          </SheetFooter>)}
      </SheetContent>
    </Sheet>);
}
