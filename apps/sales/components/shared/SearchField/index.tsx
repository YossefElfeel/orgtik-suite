"use client";

import { Search } from "lucide-react";
import { useDebouncedSearchCommit } from "@/hooks/useDebouncedSearchCommit";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type SearchConfig = {
  placeholder?: string;
  setSearchValue: (value: string) => void;
  /** ms of idle typing before calling `setSearchValue`. Default 2000. */
  debounceMs?: number;
};

function SearchField({ search }: { search: SearchConfig }) {
  const debounceMs = search.debounceMs ?? 500;
  const t = useTranslations("common");
  const placeholder = search.placeholder ?? t("search");
  const { value, setValue, handleKeyDown } = useDebouncedSearchCommit(
    search.setSearchValue,
    debounceMs,
  );

  return (
    <div className="relative w-full min-w-50 max-w-xl ">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-secondary"
        aria-hidden
      />
      <input
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-white py-2 pr-4 pl-10 text-[14px] text-secondary outline-none transition-[box-shadow,border-color]",
          "placeholder:text-secondary",
          "focus-visible:border-primary ",
        )}
      />
    </div>
  );
}

export default SearchField;
