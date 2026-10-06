"use client";

// A link that looks like a library button, for server pages (404, errors), which can't call
// buttonVariants themselves: it lives in a client module.
import type { ComponentProps } from "react";
import { buttonVariants } from "@orgtik/ui";
import { Link } from "@/i18n/routing";

type Variant = "primary" | "secondary" | "ghost";

/** Inside the app: keeps the reader's language. */
export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={buttonVariants({ variant, className })} />;
}

/** Outside the language routes (the global 404): a plain anchor. */
export function ButtonAnchor({ variant = "primary", className, ...props }: ComponentProps<"a"> & { variant?: Variant }) {
  return <a {...props} className={buttonVariants({ variant, className })} />;
}
