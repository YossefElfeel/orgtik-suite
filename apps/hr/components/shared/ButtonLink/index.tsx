"use client";

// A link that looks like a library button, with the reader's locale kept (the i18n router's Link).
// Server pages (the 404) can't call buttonVariants themselves: it lives in a client module.
import type { ComponentProps } from "react";
import { buttonVariants } from "@orgtik/ui";
import { Link } from "@/i18n/routing";

type Variant = "primary" | "secondary" | "ghost";

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={buttonVariants({ variant, className })} />;
}
