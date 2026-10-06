"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";
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
  const [searchValue, setSearchValue] = useState(searchFunctions?.search ?? "");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchFunctions?.setSearch(searchValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex pb-4 items-center justify-between gap-2 w-full",
        className
      )}
    >
      {searchFunctions && (
        <div className="relative  rounded-lg border border-gray-200 text-neutral-500  h-10 w-full flex items-center md:max-w-[50%]">
          <Search className="absolute start-3  top-1/2 h-5 w-5 -translate-y-1/2 " />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            type="search"
            placeholder={"Search..."}
            className="w-full ps-10 h-full placeholder:text-neutral-500 font-medium border-none outline-none 
            focus-visible:ring-0 shadow-none"
          />
        </div>
      )}
      {filterFunctions && <Filter filterFunctions={filterFunctions} />}
    </motion.div>
  );
}
