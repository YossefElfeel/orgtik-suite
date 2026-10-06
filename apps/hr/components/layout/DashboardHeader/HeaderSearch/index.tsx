"use client";
import { MagnifyingGlass as Search } from "@phosphor-icons/react";

import { useTranslations } from "next-intl";

import { SearchDialog } from "@/components/dialogs/SearchDialog";

export function HeaderSearch() {
  const t = useTranslations("searchDialog");

  return (
    <SearchDialog>
      <button
        type="button"
        className="relative hidden h-9 w-full min-w-0 max-w-xl flex-1 items-center rounded-md border py-2 ps-9 pe-3 text-start text-sm text-secondary outline-none transition-shadow hover:bg-muted/30 focus-visible:border-border focus-visible:ring-1 focus-visible:ring-secondary/50 md:flex"
        aria-label={t("triggerAriaLabel")}
      >
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-secondary"
          aria-hidden
        />
        <span className="truncate">{t("triggerPlaceholder")}</span>
        {/* The key as it is printed on the reader's keyboard ("Strg" on a German one). */}
        <kbd className="pointer-events-none absolute end-2 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-tertiary lg:inline">
          {t("shortcut")}
        </kbd>
      </button>
    </SearchDialog>
  );
}
