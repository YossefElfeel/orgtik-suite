"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UsePaginationSearchParamsOptions = {
  pageParam: string;
  limitParam: string;
  defaultPage?: number;
  defaultLimit?: number;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function usePaginationSearchParams({
  pageParam,
  limitParam,
  defaultPage = 1,
  defaultLimit = 10,
}: UsePaginationSearchParamsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = useMemo(
    () => parsePositiveInt(searchParams.get(pageParam), defaultPage),
    [searchParams, pageParam, defaultPage],
  );

  const limit = useMemo(
    () => parsePositiveInt(searchParams.get(limitParam), defaultLimit),
    [searchParams, limitParam, defaultLimit],
  );

  const setPagination = useCallback(
    (next: { page?: number; limit?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      const newPage = next.page ?? page;
      const newLimit = next.limit ?? limit;

      if (newPage <= defaultPage) {
        params.delete(pageParam);
      } else {
        params.set(pageParam, String(newPage));
      }

      if (newLimit === defaultLimit) {
        params.delete(limitParam);
      } else {
        params.set(limitParam, String(newLimit));
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [
      router,
      pathname,
      searchParams,
      page,
      limit,
      pageParam,
      limitParam,
      defaultPage,
      defaultLimit,
    ],
  );

  const setPage = useCallback(
    (newPage: number) => setPagination({ page: newPage }),
    [setPagination],
  );

  const setLimit = useCallback(
    (newLimit: number) => setPagination({ page: defaultPage, limit: newLimit }),
    [setPagination, defaultPage],
  );

  const resetPage = useCallback(
    () => setPagination({ page: defaultPage }),
    [setPagination, defaultPage],
  );

  return { page, limit, setPage, setLimit, setPagination, resetPage };
}
