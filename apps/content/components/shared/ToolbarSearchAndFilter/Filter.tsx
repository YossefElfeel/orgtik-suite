"use client";

import { Funnel, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { IFilterFunctions } from "../Table/type";

export function Filter({
  filterFunctions,
}: {
  filterFunctions: IFilterFunctions;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeFilter, setActiveFilter, filterData } = filterFunctions;

  const handleFilterSelect = (filterId: number | string) => {
    if (setActiveFilter) setActiveFilter(filterId);
    setIsOpen(false);
  };

  const getActiveFilterName = () => {
    const activeItem = filterData?.find((item) => item.id == activeFilter);
    return activeItem ? activeItem.name : "Filter";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-lg border-gray-200 text-neutral-500 flex items-center gap-2"
        >
          <motion.div
            animate={{ rotate: isOpen ? -15 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Funnel className="h-4 w-4" />
          </motion.div>
          <span className="font-medium hidden md:block line-clamp-1">
            {activeFilter ? getActiveFilterName() : "Filter"}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            align="end"
            className="w-52 bg-white rounded-md p-2 shadow-md overflow-hidden"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
                staggerChildren: 0.05,
              }}
            >
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {filterData?.map((filter, index) => (
                  <motion.div
                    key={filter.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.2,
                    }}
                  >
                    <DropdownMenuItem
                      className={`text-black py-2 px-3 font-medium rounded-md cursor-pointer
                        transition-all duration-200 ease-in-out
                        hover:bg-gray-100
                        ${
                          activeFilter == filter.id
                            ? "bg-primary/10 text-primary border border-primary/40"
                            : "border border-gray-200"
                        }`}
                      onClick={() => handleFilterSelect(filter.id)}
                    >
                      <motion.div
                        className="flex items-center justify-between w-full"
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span>{filter.name}</span>
                      </motion.div>
                    </DropdownMenuItem>
                  </motion.div>
                ))}
              </div>

              {activeFilter && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("")}
                    className="text-red-500 hover:text-red-600 cursor-pointer hover:bg-red-50 flex items-center gap-2 justify-center font-medium mt-1"
                  >
                    <RotateCcw className="h-4 w-4 text-red-500" />
                    Reset Filter
                  </DropdownMenuItem>
                </>
              )}
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}
