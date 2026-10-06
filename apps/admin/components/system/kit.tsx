"use client";
// Small helpers the commerce, delivery and system screens share.
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import type { ListStatus } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import { statusOf, type ApiError } from "@/store/api";

/** A localized value in the page's language, else English. */
export function usePick() {
  const locale = useLocale();
  return (v: Partial<Record<string, string>> | string | null | undefined) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v[locale]?.trim() || v.en || "";
  };
}

/** Filters and the page in the address (?state=…&mine=1&page=2), so a link opens the same view. */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = useCallback((k: string) => params.get(k) ?? "", [params]);
  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      // A new filter starts from the first page.
      if (!("page" in patch)) next.delete("page");
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );
  const href = useCallback(
    (patch: Record<string, string | number | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      const s = next.toString();
      return s ? `${pathname}?${s}` : pathname;
    },
    [params, pathname],
  );
  return { get, set, href };
}

/** The DataTable / ListStates status for a query. */
export function listStatus(isLoading: boolean, error: unknown, empty?: boolean): ListStatus {
  if (isLoading) return "loading";
  if (error) return statusOf(error) === 403 ? "forbidden" : "error";
  return empty ? "empty" : "ready";
}

export const asApiError = (e: unknown): ApiError => (e && typeof e === "object" && "status" in e ? (e as ApiError) : { status: "offline", code: "offline", message: "" });

/** Today plus n days, as an ISO instant. */
export const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

/** A country's name in the page's language, from its ISO code. */
export function useCountryName() {
  const locale = useLocale();
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return (iso: string) => {
    try {
      return names.of(iso) ?? iso;
    } catch {
      return iso;
    }
  };
}
