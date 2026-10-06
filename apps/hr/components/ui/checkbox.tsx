"use client";
import { Check as CheckIcon } from "@phosphor-icons/react";

import type { ReactNode } from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";

type CheckboxProps = CheckboxPrimitive.Root.Props & {
  /** Checked-state indicator; defaults to the design check icon. */
  icon?: ReactNode;
};

function Checkbox({ className, icon, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border-[0.8px] border-line-control bg-raised text-on-action-primary transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-fg-brand focus-visible:ring-3 focus-visible:ring-fg-brand/35 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-checked:border-fg-brand data-checked:bg-action-primary data-checked:text-on-action-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        {icon ?? <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
