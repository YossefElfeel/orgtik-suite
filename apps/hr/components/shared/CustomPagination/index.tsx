import { CaretDown as ChevronDown } from "@phosphor-icons/react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { IPaginationOptions } from "../Table/type";

const BTNS_COUNT = 4;

export function CustomPagination({
  currentPage,
  totalPages,
  limit,
  baseUrl,
  className,
  totalItems: totalItemsGeter,
  onPageChange,
  onLimitChange,
}: IPaginationOptions) {
  const router = useRouter();
  const t = useTranslations("pagination");
  const tActions = useTranslations("actions");

  const isFirstPage =
    currentPage === 1 || (totalPages === 0 && currentPage === 0);
  const isLastPage = currentPage === totalPages;
  const isFewPages = totalPages <= BTNS_COUNT;
  const isPrevDots = !isFewPages && currentPage > Math.ceil(BTNS_COUNT / 2);
  const isAfterDots =
    !isFewPages && currentPage < totalPages - Math.floor(BTNS_COUNT / 2);

  const totalItems = totalItemsGeter || totalPages * limit;
  // Dynamic LIMIT_OPTIONS calculation
  const limitOptions = useMemo(() => {
    const baseOptions = [10, 20, 50, 100];
    if (totalItems === 0) return baseOptions;

    const validOptions = baseOptions.filter((option) => option <= totalItems);

    if (!validOptions.includes(limit)) {
      validOptions.push(limit);
      validOptions.sort((a, b) => a - b);
    }

    const quarterItems = Math.ceil(totalItems / 4);
    const halfItems = Math.ceil(totalItems / 2);
    [quarterItems, halfItems].forEach((option) => {
      if (
        option > 0 &&
        option <= totalItems &&
        !validOptions.includes(option)
      ) {
        validOptions.push(option);
      }
    });

    return [...new Set(validOptions)].sort((a, b) => a - b);
  }, [totalPages, limit]);

  function generateArr(start: number, count = BTNS_COUNT) {
    return Array.from(
      { length: Math.min(count, totalPages - start + 1) },
      (_, i) => start + i,
    );
  }

  const startPage = isFewPages
    ? 1
    : Math.max(
        1,
        Math.min(
          currentPage - Math.floor(BTNS_COUNT / 2),
          totalPages - BTNS_COUNT + 1,
        ),
      );

  const handlePageChange = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    if (onPageChange) {
      onPageChange(page);
    } else if (baseUrl) {
      router.push(`${baseUrl}?page=${page}&limit=${limit}`);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    if (onLimitChange) {
      onLimitChange(newLimit);
    } else if (baseUrl) {
      router.push(`${baseUrl}?page=1&limit=${newLimit}`);
    }
  };

  const startItem = totalPages === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <section className="flex  text-body flex-col  items-center justify-between w-full gap-4 lg:gap-6 p-4   border-line">
      <div
        className={cn(
          "flex items-center justify-between w-full gap-4 lg:gap-6",
          className,
        )}
      >
        <div
          className={cn("flex items-center justify-center w-full lg:w-auto")}
        >
          <Pagination>
            <PaginationContent className="gap-1">
              {/* Previous Button */}
              <PaginationItem>
                <PaginationPrevious
                  text=""
                  aria-label={tActions("previousPage")}
                  href={
                    baseUrl
                      ? `${baseUrl}?page=${currentPage - 1}&limit=${limit}`
                      : "#"
                  }
                  onClick={(e) => handlePageChange(e, currentPage - 1)}
                  aria-disabled={isFirstPage}
                  className={cn(
                    "py-2 px-1 flex items-center justify-center me-1",
                    isFirstPage
                      ? "pointer-events-none opacity-40 cursor-not-allowed "
                      : "border border-line",
                  )}
                />
              </PaginationItem>

              {/* Previous Ellipsis */}
              {isPrevDots && (
                <li aria-hidden="true" className="h-9 w-9 text-fg-subtle flex items-center justify-center px-2">
                  ...
                </li>
              )}

              {/* Page Number Buttons */}
              {generateArr(startPage).map((ele) => (
                <PaginationItem key={ele} className="space-x-1">
                  <PaginationLink
                    href={
                      baseUrl ? `${baseUrl}?page=${ele}&limit=${limit}` : "#"
                    }
                    onClick={(e) => handlePageChange(e, ele)}
                    isActive={currentPage === ele}
                    className={cn(
                      "h-9 w-9 flex items-center justify-center border  transition-all duration-200",
                      currentPage === ele
                        ? "bg-gray border-line transform scale-105"
                        : "cursor-pointer",
                    )}
                  >
                    {ele}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* Next Ellipsis */}
              {isAfterDots && (
                <li aria-hidden="true" className="h-9 w-9 text-fg-subtle flex items-center justify-center px-2">
                  ...
                </li>
              )}

              {/* Next Button */}
              <PaginationItem>
                <PaginationNext
                  text=""
                  aria-label={tActions("nextPage")}
                  href={
                    baseUrl
                      ? `${baseUrl}?page=${currentPage + 1}&limit=${limit}`
                      : "#"
                  }
                  onClick={(e) => handlePageChange(e, currentPage + 1)}
                  aria-disabled={isLastPage}
                  className={cn(
                    "py-2 px-1 flex items-center justify-center ms-1",
                    isLastPage
                      ? "pointer-events-none opacity-40 cursor-not-allowed bg-sunken"
                      : "border border-line",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <div className="md:flex items-center hidden gap-3"></div>
        {/* <div className="text-fg-subtle hidden w-full sm:block">
          {startItem}-{endItem} of {totalItems}
        </div> */}
        <div className="flex items-center gap-4">
          <p className="text-secondary whitespace-nowrap hidden sm:block">
            {t("showing")} {startItem} {t("to")} {endItem} {t("of")}{" "}
            {totalItems} {t("entries")}
          </p>
          <div className="relative flex items-center justify-center min-w-[80px] ">
            <select
              aria-label={tActions("rowsPerPage")}
              value={limit}
              onChange={handleLimitChange}
              className="appearance-none w-full bg-raised border border-line rounded-[8px] 
               py-1.5 ps-3 pe-8 text-sm font-medium text-fg 
               cursor-pointer hover:border-line-strong focus:outline-none 
               transition-all text-center hidden md:block"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {t("show")} {option}
                </option>
              ))}
            </select>

            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle pointer-events-none hidden md:block" />
          </div>
        </div>
      </div>
      <div className="sm:hidden w-full">
        <div className="flex items-center rounded-md justify-center gap-2 px-3 py-2 bg-gray/10  border border-gray">
          <span className=" text-fg ">
            {t("showing")} {startItem} - {endItem} {t("of")} {totalItems}{" "}
            {t("items")}
          </span>
        </div>
      </div>
    </section>
  );
}
