"use client";

// A page's sub-pages as tabs: real links (they can be opened in a new tab and shared), the current
// one marked aria-current. The old tab rows marked the current tab by colour only.
import { cn } from "@orgtik/ui";
import { Link, usePathname } from "@/i18n/routing";

export function PageTabs({ label, tabs }: { label: string; tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const current = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-label focus-visible:outline-2 focus-visible:outline-focus",
              current ? "border-action-primary text-fg" : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
