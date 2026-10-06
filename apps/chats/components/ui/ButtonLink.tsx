"use client";

// A link that looks like a library button, for server pages (404), which can't call
// buttonVariants themselves: it lives in a client module.
import type { ComponentProps } from "react";
import Link from "next/link";
import { buttonVariants } from "@orgtik/ui";

type Variant = "primary" | "secondary" | "ghost";

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={buttonVariants({ variant, className })} />;
}
