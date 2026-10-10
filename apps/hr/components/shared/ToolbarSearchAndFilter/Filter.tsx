"use client";
import { CaretDown as ChevronDown } from "@phosphor-icons/react";
import { Button } from "@orgtik/ui";
import { Menu as DropdownMenu, MenuContent as DropdownMenuContent, MenuItem as DropdownMenuItem, MenuTrigger as DropdownMenuTrigger } from "@orgtik/ui";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { IFilterFunctions } from "@/types/resource-table";
export function Filter({ filterFunctions, }: {
    filterFunctions: IFilterFunctions;
}) {
    const tCommon = useTranslations("common");
    const [isOpen, setIsOpen] = useState(false);
    const { activeFilter, setActiveFilter, filterData } = filterFunctions;
    const handleFilterSelect = (filterId: number | string) => {
        if (setActiveFilter)
            setActiveFilter(filterId);
        setIsOpen(false);
    };
    const getActiveFilterName = () => {
        const activeItem = filterData?.find((item) => item.id === activeFilter);
        return activeItem ? activeItem.name : tCommon("allFilters");
    };
    return (<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger render={<Button variant="secondary" className="h-10 px-[6px] rounded-[8px] border-line bg-raised text-secondary flex items-center gap-[6px] font-normal text-[15px]  hover:bg-sunken transition-all"/>}>
        <span>{getActiveFilterName()}</span>
        <ChevronDown className={`h-4 w-4 text-fg-subtle transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}/>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 bg-raised rounded-xl p-1.5 shadow-lg border-line mt-1">
        <div className="max-h-[300px] overflow-y-auto">
          {filterData?.map((filter) => (<DropdownMenuItem key={filter.id} className={`py-2.5 px-3 text-sm rounded-lg cursor-pointer mb-0.5 last:mb-0
                ${activeFilter == filter.id
                ? "bg-sunken text-fg font-medium"
                : "text-fg-muted hover:bg-sunken hover:text-fg"}`} onClick={() => handleFilterSelect(filter.id)}>
              {filter.name}
            </DropdownMenuItem>))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>);
}
