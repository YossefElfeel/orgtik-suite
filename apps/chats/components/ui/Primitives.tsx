"use client";

/**
 * SOMION HQ - UI PRIMITIVES
 *
 * Small, boring, consistent. One radius scale, one focus ring, one shadow
 * family, tactile :active feedback everywhere. Nothing here invents a look;
 * it enforces the one already decided in globals.css.
 */

import { Children, forwardRef, isValidElement } from "react";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import {
  Card, Skeleton as SharedSkeleton, Badge,
  Button as LibButton,
  EmptyState as LibEmptyState,
  ErrorState as LibErrorState,
  Field as LibField,
  IconButton,
  Input,
  buttonVariants,
} from "@orgtik/ui";

/* ------------------------------------------------------------------ button */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Icon-only buttons MUST pass this - it becomes the accessible name. */
  label?: string;
  iconOnly?: boolean;
  /**
   * Renders an anchor that looks like a button. A <button> inside an <a> is
   * invalid HTML and the nesting swallows the navigation, so anything that
   * goes somewhere must be a link itself rather than a button wrapped in one.
   */
  href?: string;
}

/*
 * The library's Button and IconButton (Chats wave, FS-CHT-9): the brand's pill, focus ring, sizes and
 * states. HQ's props stay, so the call sites don't change: iconOnly takes the label as its name,
 * and href renders a link that looks like a button (a <button> inside an <a> is invalid HTML).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", label, iconOnly, href, className = "", children, ...rest },
  ref,
) {
  const libSize = size === "sm" ? "sm" : "md";
  if (href) {
    return (
      <Link
        href={href}
        className={buttonVariants({ variant, size: libSize, className: `${iconOnly ? "aspect-square px-0" : ""} ${className}` })}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
      >
        {children}
      </Link>
    );
  }
  if (iconOnly) {
    return (
      <IconButton
        ref={ref}
        label={label ?? ""}
        icon={children}
        variant={variant === "danger" ? "secondary" : variant}
        size={libSize}
        className={className}
        title={label}
        {...rest}
      />
    );
  }
  /* HQ passes an icon as the first (or last) child; the library takes it as startIcon/endIcon, so
     it sits beside the label instead of above it. */
  const parts = Children.toArray(children);
  const isIcon = (c: unknown) => isValidElement(c) && typeof c.type !== "string";
  const startIcon = parts.length > 1 && isIcon(parts[0]) ? parts[0] : undefined;
  const endIcon = !startIcon && parts.length > 1 && isIcon(parts[parts.length - 1]) ? parts[parts.length - 1] : undefined;
  const text = parts.filter((c) => c !== startIcon && c !== endIcon);
  return (
    <LibButton ref={ref} variant={variant} size={libSize} className={className} startIcon={startIcon} endIcon={endIcon} {...rest}>
      {text}
    </LibButton>
  );
});

/* ------------------------------------------------------------------- panel */

export function Panel({children,className='',padded=true}:{children:ReactNode;className?:string;padded?:boolean}){return <Card padding={padded?'md':'none'} className={className}>{children}</Card>;}
/* -------------------------------------------------------------------- chip */

/** A short label: the library's Badge, in HQ's four tones. */
export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "danger" | "success";
  className?: string;
}) {
  return (
    <Badge tone={tone === "accent" ? "brand" : tone} size="sm" className={className}>
      {children}
    </Badge>
  );
}

/* ------------------------------------------------------------------ counts */

/** Unread and mention counts. Tabular so the sidebar never jitters. */
export function Count({value,mention=false}:{value:number;mention?:boolean}){const t=useT();if(value<=0)return null;return <Badge tone={mention?'brand':'neutral'} size='sm' className='tabular-nums'><span aria-hidden>{value>99?'99+':value}</span><span className='sr-only'>{mention?t('count.mentions','{n, plural, one {# mention} other {# mentions}}',{n:value}):t('count.unread','{n} unread',{n:value})}</span></Badge>;}
/* ------------------------------------------------------------------ inputs */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** The library's Field and Input: label, help text and error wired to the control. Never a
    placeholder standing in for a label. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, className = "", size: _size, ...rest },
  ref,
) {
  return (
    <LibField label={label} description={hint} error={error} className={className}>
      <Input ref={ref} {...rest} />
    </LibField>
  );
});

/* ------------------------------------------------------------------ states */

/** Empty states say how to fill the thing, never just "nothing here": the library's EmptyState. */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return <LibEmptyState title={title} description={body} action={action} icon={icon} />;
}

/** Skeletons match the shape of what is arriving, never a spinner. */
/* ------------------------------------------------------------- section head */

/**
 * Section headings carry their own weight. No eyebrow, no section number, no
 * floating explainer in the corner.
 */
export function SectionHead({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3">
      <div className="flex items-baseline gap-2.5 min-w-0">
        <h2 className={"hq-title truncate "+("ch-color-7f7330")} >
          {title}
        </h2>
        {meta && (
          <span className={"tabular shrink-0 text-caption "+("ch-color-4a0211")} >
            {meta}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
