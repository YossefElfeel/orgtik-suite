"use client";

// A section's sub-pages (Settings: Project and Team). Real links in the reader's language, the
// current one marked aria-current="page" and in bold, not by colour alone (an underline on phones, the
// library side tabs' fill from md up). It compared
// "/en/settings" with "/settings", so nothing was ever current, and it was a fixed 260px column that
// left about 100px for the form on a phone (MKT-038). Now it is a row of tabs on phones and a column
// beside the content from md up.
import { useTranslations } from "next-intl";
import { cn } from "@orgtik/ui";
import { Link, usePathname } from "@/i18n/routing";

export interface ISettingsItems {
  label: string;
  path: string;
}

function SettingsSidebar({ settingsItems, label }: { settingsItems: ISettingsItems[]; label?: string }) {
  const t = useTranslations("SettingsNav");
  const pathname = usePathname();

  return (
    <nav aria-label={label ?? t("label")} className="md:w-56 md:shrink-0">
      <ul className="flex gap-1 overflow-x-auto border-b border-line md:flex-col md:overflow-visible md:border-b-0">
        {settingsItems.map((item) => {
          const current = pathname === item.path;
          return (
            <li key={item.path} className="shrink-0">
              <Link
                href={item.path}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center whitespace-nowrap border-b-2 px-3 py-2 text-label focus-visible:outline-2 focus-visible:outline-focus",
                  "md:mb-0 md:rounded-field md:border-b-0",
                  current ? "border-action-primary font-semibold text-fg md:bg-brand-subtle md:text-fg-brand" : "border-transparent text-fg-muted hover:bg-hover hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
export default SettingsSidebar;
