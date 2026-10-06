"use client";

import LanguageFlag from "@/components/shared/LanguageFlag";
import { getCatalogLanguageDisplay } from "@/lib/i18n/catalog-languages";
import { cn } from "@/lib/utils";
import type { CatalogLanguageOption } from "@/types/catalog-language";
import type { SupportedLanguage } from "@/types/localized";

type Props = {
  languages: CatalogLanguageOption[];
  activeLanguage: SupportedLanguage;
  setActiveLanguage: (code: SupportedLanguage) => void;
  size?: "lg" | "sm";
  className?: string;
  getHasError?: (code: SupportedLanguage) => boolean;
};

export default function LocalizedLanguageTabs({
  languages,
  activeLanguage,
  setActiveLanguage,
  size = "sm",
  className,
  getHasError,
}: Props) {
  if (languages.length <= 1) {
    return null;
  }

  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/60 px-1 py-0.5 backdrop-blur-xs",
        className,
      )}
    >
      {languages.map((language) => {
        const display = getCatalogLanguageDisplay(language.code);
        const isActive = activeLanguage === language.code;
        const hasError = getHasError?.(language.code) ?? false;

        return (
          <button
            key={language.code}
            type="button"
            title={language.nativeName}
            aria-label={language.nativeName}
            aria-pressed={isActive}
            onClick={() => setActiveLanguage(language.code)}
            className={cn(
              "relative flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer",
              isSmall ? "h-7 w-11" : "h-8 w-12",
              isActive
                ? "bg-background ring-1 ring-black/5"
                : !hasError
                  ? "hover:bg-background/40"
                  : "hover:bg-destructive/10",
            )}
          >
            <LanguageFlag
              flagCode={display.flagCode}
              label={language.nativeName}
              size="lg"
              className="rounded-[2px] ring-1 ring-black/10"
            />
            {hasError ? (
              <span
                className="absolute -top-0.5 -end-0.5 size-1.5 rounded-full bg-destructive"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
