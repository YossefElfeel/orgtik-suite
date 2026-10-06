import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge min-w-20 inline-flex h-7 w-fit px-3! shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "bg-muted/50 hover:bg-muted/80 text-muted-foreground border border-border",
        "ghost-primary":
          "bg-primary/5 text-primary border-primary/30 hover:bg-primary/20 hover:text-primary",
        "ghost-yellow":
          "bg-yellow/5 text-yellow-500 border-yellow/30 hover:bg-yellow/20 hover:text-yellow",
        "ghost-green":
          "bg-green/5 text-green-500 border-green/30 hover:bg-green/20 hover:text-green-500",
        "ghost-red":
          "bg-red/5 text-red-500 border-red/30 hover:bg-red/20 hover:text-red",
        "ghost-blue":
          "bg-blue/5 text-blue-500 border-blue/30 hover:bg-blue/20 hover:text-blue",
        "ghost-orange":
          "bg-orange/5 text-orange border-orange/30 hover:bg-orange/20 hover:text-orange",
        "ghost-verdigris":
          "bg-verdigris/5 text-verdigris border-verdigris/30 hover:bg-verdigris/20 hover:text-verdigris",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
