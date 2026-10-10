"use client";

// HR's icon-only button (HR wave, FS-HR-4, HR-016): the label is required, so every icon
// button has a name for screen readers and the same words as a tooltip for everyone else.
// It is one element: it can be a dialog, sheet or menu trigger itself (lib/trigger), with no
// wrapper span between the tooltip and the button. With `href` it is a link that looks like the
// button (a real <a>, announced as a link): the app's own pages go through the locale-aware Link.
import { Button, buttonVariants } from "@orgtik/ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/bindings/tooltip";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { IconButtonProps } from "@/types/icon-button";

export function IconButton({
  label,
  size = "sm",
  tooltip = true,
  children,
  href,
  download,
  target,
  rel,
  variant,
  className,
  ...props
}: IconButtonProps) {
  const control = href ? (
    href.startsWith("/") ? (
      <Link href={href} aria-label={label} className={cn(buttonVariants({ variant, size }), className)}>
        {children}
      </Link>
    ) : (
      <a href={href} download={download} target={target} rel={rel} aria-label={label} className={cn(buttonVariants({ variant, size }), className)}>
        {children}
      </a>
    )
  ) : (
    <Button size={size} variant={variant} className={className} aria-label={label} {...props}>
      {children}
    </Button>
  );
  if (!tooltip) return control;
  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger render={control} />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
