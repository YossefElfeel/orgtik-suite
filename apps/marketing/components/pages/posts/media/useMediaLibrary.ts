"use client";

// The gallery adapter (FS-MKT-10): one data source for the gallery page and every picker, on the
// app's RTK cache. The list's status follows the request, so a failed fetch is an error with Retry
// and not "No media yet" (MKT-057). The type filter and its counts are the server's: the old
// gallery filtered only the page it had, so "Videos" showed nothing while page 2 had one. Until the
// API sends meta.counts (proposed contract) the filter isn't offered at all, rather than lie.
import { useEffect, useState } from "react";
import type { ListStatus } from "@orgtik/ui";
import { useGetGalleryQuery, type MediaType } from "@/redux/features/posts/galleryApi";

export type MediaFilter = "all" | MediaType;

export function useMediaLibrary({ page, pageSize, search, type, skip }: { page: number; pageSize: number; search: string; type: MediaFilter; skip?: boolean }) {
  const [query, setQuery] = useState(search.trim());
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetGalleryQuery(
    { page, limit: pageSize, search: query || undefined, type: type === "all" ? undefined : type },
    { skip },
  );
  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;
  const counts = meta?.counts;
  const filtered = Boolean(query) || type !== "all";
  const status: ListStatus = isLoading
    ? "loading"
    : isError
      ? (error as { status?: number } | undefined)?.status === 403
        ? "forbidden"
        : "error"
      : items.length
        ? "ready"
        : "empty";
  return {
    items,
    total: meta?.total ?? items.length,
    counts,
    /** The server reports totals per type, so the type filter can be trusted. */
    canFilterByType: Boolean(counts),
    status,
    filtered,
    refreshing: isFetching && !isLoading,
    refetch,
  };
}
