"use client";
import { Check } from "@phosphor-icons/react";

import type { ReactNode } from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  checkedIcon = <Check className="size-2.5" strokeWidth={3} />,
  uncheckedIcon = null,
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
  checkedIcon?: ReactNode;
  uncheckedIcon?: ReactNode;
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch cursor-pointer relative inline-flex shrink-0 items-center rounded-full border border-transparent p-[2px] transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-fg-brand focus-visible:ring-3 focus-visible:ring-fg-brand/35 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-5 data-[size=default]:w-8 data-[size=sm]:h-4 data-[size=sm]:w-6 data-checked:bg-action-primary data-unchecked:bg-line data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none flex items-center justify-center rounded-full bg-background text-fg-brand ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-3 group-data-[size=sm]/switch:data-checked:translate-x-2 rtl:group-data-[size=default]/switch:data-checked:-translate-x-3 rtl:group-data-[size=sm]/switch:data-checked:-translate-x-2 group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0"
      >
        <span className="group-data-unchecked/switch:hidden">
          {checkedIcon}
        </span>
        <span className="group-data-checked/switch:hidden">
          {uncheckedIcon}
        </span>
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
