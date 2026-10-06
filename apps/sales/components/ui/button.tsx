import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Icon } from "@iconify/react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button cursor-pointer inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "[background:var(--primary-button-bg)] text-primary-foreground hover:opacity-90",
        outline:
          "border-border bg-white text-secondary hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        "outline-primary":
          "border-primary bg-white text-primary hover:bg-primary/5 hover:text-primary",
        secondary:
          "text-secondary bg-secondary/5 border border-border hover:bg-secondary/15",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",

        "ghost-primary":
          "bg-primary/10 text-primary hover:bg-primary hover:text-white",
        "ghost-edit":
          "bg-yellow/10 text-yellow hover:bg-yellow hover:text-white",
        "ghost-green": "bg-green/10 text-green hover:bg-green hover:text-white",
        success: "border-green bg-green text-white hover:bg-green/90",

        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-5 ",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    icon?: string;
    iconPosition?: "start" | "end";
    iconClassName?: string;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  icon,
  iconClassName,
  iconPosition = "start",
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {icon && iconPosition === "start" ? (
        <Icon
          icon={icon}
          className={cn(iconClassName)}
          data-icon="inline-start"
        />
      ) : null}
      {children}
      {icon && iconPosition === "end" ? (
        <Icon
          icon={icon}
          className={cn(iconClassName)}
          data-icon="inline-end"
        />
      ) : null}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
