import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-[14px] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        warning: "bg-warning-solid text-on-warning-solid hover:brightness-95 active:brightness-90",
        default: "bg-action-primary text-on-action-primary hover:bg-action-primary-hover active:brightness-90",
        destructive:
          "bg-danger-solid text-on-danger-solid hover:bg-danger-solid-hover active:brightness-90",
        outline:
          "border border-line-control bg-transparent text-fg hover:bg-hover active:bg-pressed",
        secondary:
          "border border-line-control bg-transparent text-fg hover:bg-hover active:bg-pressed",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Spinner replaces icon when loading */}
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
