"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WEBSITE_LANGUAGES, type WebsiteLanguages } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ReactNode } from "react";

interface LanguageTabsListProps {
  className?: string;
  triggerClassName?: string;
  showFlags?: boolean;
  showCodeOnMobile?: boolean;
  renderLabel?: (lang: { code: WebsiteLanguages; name: string }) => ReactNode;
}

export function LanguageTabsList({
  className,
  triggerClassName,
  showFlags = true,
  showCodeOnMobile = true,
  renderLabel,
}: LanguageTabsListProps) {
  return (
    <TabsList className={cn("grid w-full grid-cols-4", className)}>
      {WEBSITE_LANGUAGES.map((lang) => (
        <TabsTrigger
          key={lang.code}
          value={lang.code}
          className={cn(
            "flex items-center justify-center gap-2 text-xs sm:text-sm",
            triggerClassName
          )}
        >
          {showFlags && (
            <Image
              src={`/images/flags/${lang.code}.png`}
              alt={lang.code}
              width={18}
              height={18}
              className="rounded-full"
            />
          )}
          {renderLabel ? (
            renderLabel(lang)
          ) : (
            <>
              <span className="hidden sm:inline-block">{lang.name}</span>
              {showCodeOnMobile && (
                <span className="sm:hidden uppercase">{lang.code}</span>
              )}
            </>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

