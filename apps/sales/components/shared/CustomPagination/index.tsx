import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";

export type IPaginationOptions = {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  limit: number;
  className?: string;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
};

const navBtn =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-greyscale-200 bg-white text-greyscale-600 transition-colors " +
  "hover:border-greyscale-300 hover:bg-greyscale-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2";

function getPaginationRange(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | "ellipsis")[] = [1];
  const showLeftEllipsis = currentPage > 3;
  const showRightEllipsis = currentPage < totalPages - 2;

  if (showLeftEllipsis) {
    items.push("ellipsis");
  }

  let start = Math.max(2, currentPage - 1);
  let end = Math.min(totalPages - 1, currentPage + 1);

  if (!showLeftEllipsis) {
    start = 2;
    end = Math.min(3, totalPages - 1);
  }

  if (!showRightEllipsis) {
    start = Math.max(2, totalPages - 2);
    end = totalPages - 1;
  }

  for (let page = start; page <= end; page++) {
    items.push(page);
  }

  if (showRightEllipsis) {
    items.push("ellipsis");
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
}

export function CustomPagination({
  currentPage,
  totalPages,
  limit,
  baseUrl,
  className,
  totalItems: totalItemsGetter,
  onPageChange,
  onLimitChange,
}: IPaginationOptions) {
  const router = useRouter();
  const t = useTranslations("common");

  const isFirstPage =
    currentPage <= 1 || (totalPages === 0 && currentPage === 0);
  const isLastPage = totalPages === 0 || currentPage >= totalPages;

  const totalItems = totalItemsGetter || totalPages * limit;

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
  }, [totalItems, limit]);

  const handlePageChange = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    if (page < 1 || page > totalPages || totalPages === 0) return;

    if (onPageChange) {
      onPageChange(page);
    } else if (baseUrl) {
      router.push(`${baseUrl}?page=${page}&limit=${limit}`);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);

    if (onLimitChange) {
      onLimitChange(newLimit);
    } else if (baseUrl) {
      router.push(`${baseUrl}?page=1&limit=${newLimit}`);
    }
  };

  const pageHref = (page: number) =>
    baseUrl && !onPageChange ? `${baseUrl}?page=${page}&limit=${limit}` : "#";

  const pageStatus =
    totalPages === 0 
      ? t("pageOf", { current: 0, total: 0 }) 
      : t("pageOf", { current: currentPage, total: totalPages });

  const pageItems = getPaginationRange(currentPage, totalPages);

  if (totalPages <= 1) return null;
  return (
    <section
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm",
        className,
      )}
    >
      <span className="font-medium text-greyscale-600 tabular-nums">
        {pageStatus}
      </span>

      <nav
        className="flex items-center"
        role="navigation"
        aria-label="pagination"
      >
        <ul className="flex items-center gap-1">
          <li>
            <a
              href={pageHref(Math.max(1, currentPage - 1))}
              aria-label={t("goToPreviousPage")}
              aria-disabled={isFirstPage}
              onClick={(e) => handlePageChange(e, currentPage - 1)}
              className={cn(
                navBtn,
                isFirstPage &&
                  "pointer-events-none cursor-not-allowed opacity-40 hover:border-greyscale-200 hover:bg-white",
              )}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </a>
          </li>

          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <li key={`ellipsis-${index}`}>
                <span
                  className="flex size-8 items-center justify-center text-greyscale-400"
                  aria-hidden
                >
                  <MoreHorizontal className="size-4" />
                </span>
              </li>
            ) : (
              <li key={item}>
                <a
                  href={pageHref(item)}
                  aria-label={t("page", { page: item })}
                  aria-current={currentPage === item ? "page" : undefined}
                  onClick={(e) => handlePageChange(e, item)}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition-colors",
                    currentPage === item
                      ? "bg-primary/10 text-primary"
                      : "text-greyscale-600 hover:text-greyscale-900",
                  )}
                >
                  {item}
                </a>
              </li>
            ),
          )}

          <li>
            <a
              href={pageHref(Math.min(totalPages || 1, currentPage + 1))}
              aria-label={t("goToNextPage")}
              aria-disabled={isLastPage}
              onClick={(e) => handlePageChange(e, currentPage + 1)}
              className={cn(
                navBtn,
                isLastPage &&
                  "pointer-events-none cursor-not-allowed opacity-40 hover:border-greyscale-200 hover:bg-white",
              )}
            >
              <ChevronRight className="size-4" aria-hidden />
            </a>
          </li>
        </ul>
      </nav>

      <div className="flex items-center gap-2">
        <label
          htmlFor="pagination-limit"
          className="whitespace-nowrap text-greyscale-500"
        >
          {t("itemsPerPage")}
        </label>
        <div className="relative">
          <select
            id="pagination-limit"
            value={limit}
            onChange={handleLimitChange}
            className={cn(
              "appearance-none cursor-pointer rounded-lg border border-greyscale-200 bg-white py-1.5 pl-3.5 pr-9",
              "text-sm font-medium text-greyscale-800 tabular-nums",
            )}
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-greyscale-500"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
