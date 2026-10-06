"use client";

// The two halves of Systems as tabs of one page (FS-SOS-9). /systems used to be a click-through page
// of two illustrations before either list; now it opens on the suite's apps.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@orgtik/ui";

export function SystemsNav() {
  const t = useTranslations("Systems");
  const pathname = usePathname();
  const tabs = [
    { href: "/systems", label: t("tabApps"), active: pathname === "/systems" || pathname === "/systems/internal" },
    { href: "/systems/cms", label: t("tabCms"), active: pathname.startsWith("/systems/cms") },
  ];
  return (
    <nav aria-label={t("navLabel")} className="flex gap-1 border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "-mb-px rounded-t-field border-b-2 px-4 py-2.5 text-label font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
            tab.active ? "border-action-primary text-fg" : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
