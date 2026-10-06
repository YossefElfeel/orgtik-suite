"use client";
import { MagnifyingGlass as Search } from "@phosphor-icons/react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NAV_ICONS } from "@/constants/nav-icons";
import { useTranslations } from "next-intl";

import { useSidebarItems } from "@/components/layout/Sidebar/useSidebarItems";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { SearchablePage } from "@/types/search";
import { triggerProps } from "@/lib/trigger";

interface SearchDialogProps {
  children: React.ReactNode;
}

export function SearchDialog({ children }: SearchDialogProps) {
  const t = useTranslations("searchDialog");
  const router = useRouter();
  const { sidebarItems } = useSidebarItems();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pages = useMemo<SearchablePage[]>(
    () =>
      sidebarItems.flatMap((section) =>
        section.items.map((item) => ({
          label: item.label ?? "",
          path: item.path,
          sectionTitle: section.title,
        })),
      ),
    [sidebarItems],
  );

  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return pages;
    }

    return pages.filter(
      (page) =>
        page.label.toLowerCase().includes(normalizedQuery) ||
        page.sectionTitle?.toLowerCase().includes(normalizedQuery),
    );
  }, [pages, query]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchablePage[]>();

    filteredPages.forEach((page) => {
      const sectionTitle = page.sectionTitle ?? "";
      const existing = groups.get(sectionTitle) ?? [];
      groups.set(sectionTitle, [...existing, page]);
    });

    return Array.from(groups.entries());
  }, [filteredPages]);

  const flatResults = useMemo(
    () => groupedResults.flatMap(([, items]) => items),
    [groupedResults],
  );

  const resetState = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (!nextOpen) {
        resetState();
      }
    },
    [resetState],
  );

  const handleSelect = useCallback(() => {
    setOpen(false);
    resetState();
  }, [resetState]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % flatResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (current) => (current - 1 + flatResults.length) % flatResults.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selectedPage = flatResults[selectedIndex];

      if (selectedPage) {
        setOpen(false);
        resetState();
        router.push(selectedPage.path);
      }
    }
  };

  let resultIndex = -1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger {...triggerProps(children)} />

      <DialogContent
        showCloseButton={false}
        className="top-[18%] max-h-[min(70vh,32rem)] w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>

        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Search className="size-4 shrink-0 text-secondary" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("placeholder")}
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            aria-label={t("placeholder")}
          />
        </div>

        <ScrollArea className="max-h-[min(58vh,26rem)]">
          <div className="p-2">
            {flatResults.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-secondary">
                {t("noResults")}
              </p>
            ) : (
              groupedResults.map(([sectionTitle, items]) => (
                <div key={sectionTitle} className="mb-2 last:mb-0">
                  {sectionTitle ? (
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                      {sectionTitle}
                    </p>
                  ) : null}

                  <ul className="space-y-0.5">
                    {items.map((page) => {
                      resultIndex += 1;
                      const currentIndex = resultIndex;
                      const isSelected = currentIndex === selectedIndex;

                      return (
                        <li key={page.path}>
                          <Link
                            href={page.path}
                            onClick={handleSelect}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-secondary transition-colors",
                              isSelected
                                ? "bg-muted text-foreground"
                                : "hover:bg-muted/70",
                            )}
                          >
                            <span aria-hidden="true" className="shrink-0 text-[18px] leading-none">{NAV_ICONS[page.path]}</span>
                            <span className="truncate">{page.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
