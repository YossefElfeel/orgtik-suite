"use client";
import { MagnifyingGlass as Search } from "@phosphor-icons/react";

import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { IFilterFunctions, ISearchFunctions } from "../Table/type";
import { Filter } from "./Filter";

interface ToolbarSearchAndFilterProps {
  filterFunctions?: IFilterFunctions;
  searchFunctions?: ISearchFunctions;
  className?: string;
}

export function ToolbarSearchAndFilter({
  searchFunctions,
  filterFunctions,
  className,
}: ToolbarSearchAndFilterProps) {
  const tCommon = useTranslations("common");
  const [searchValue, setSearchValue] = useState(searchFunctions?.search ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outside = searchFunctions?.search ?? "";

  // The box follows the list's search when it changes from outside (Back, a shared link).
  useEffect(() => {
    setSearchValue(outside);
  }, [outside]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // The text shows at once; the list is asked once typing pauses (300 ms), not on every key (FS-HR-6).
  const handleChange = (value: string) => {
    setSearchValue(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => searchFunctions?.setSearch(value), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex pb-4 items-center justify-between gap-2 w-full",
        className,
      )}
    >
      {searchFunctions && (
        <div className="relative rounded-lg border border-line text-fg-subtle h-10 w-full flex items-center md:max-w-[40%] lg:max-w-[50%]">
          <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 " />
          <Input
            value={searchValue}
            onChange={(e) => handleChange(e.target.value)}
            type="text"
            placeholder={tCommon("searchPlaceholder")}
            aria-label={tCommon("search")}
            className="w-full ps-10 h-full placeholder:text-fg-subtle font-medium border-none outline-none 
            focus-visible:ring-0 shadow-none"
          />
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {filterFunctions && <Filter filterFunctions={filterFunctions} />}
      </div>
    </motion.div>
  );
}
