"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  checked,
  ...props
}: RadioPrimitive.Root.Props & { checked?: boolean }) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-5 shrink-0 rounded-full border-[1.5px] border-line bg-raised outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-fg-brand focus-visible:ring-3 focus-visible:ring-fg-brand/35 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-checked:border-fg-brand data-checked:bg-raised",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-5 items-center justify-center"
      >
        <span className="absolute top-1/2 start-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-action-primary" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
