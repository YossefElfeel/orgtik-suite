"use client";

// A dashboard block with its own heading (h2 under the page's h1) and an optional way on
// ("View all customers"). The old blocks were rounded divs with h3s straight under the page title.
import { useId, type ReactNode } from "react";
import { Card, cn } from "@orgtik/ui";
import { Link } from "@/i18n/routing";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  /** A link to the full list, when the reader may open it. */
  more?: { href: string; label: string } | null;
  className?: string;
  children: ReactNode;
};

export default function HomeSection({ title, description, more, className, children }: Props) {
  const id = useId();
  return (
    <Card padding="md" className={cn("flex min-w-0 flex-col gap-4", className)}>
      <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={id} className="font-display text-title-sm text-fg">
              {title}
            </h2>
            {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
          </div>
          {more ? (
            <Link href={more.href} className="shrink-0 text-label text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              {more.label}
            </Link>
          ) : null}
        </div>
        {children}
      </section>
    </Card>
  );
}
