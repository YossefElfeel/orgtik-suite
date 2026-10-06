"use client";
// Pieces the Customers and Billing screens share: filters in the URL, names of tools, countries and
// currencies in the reader's language, the API's error answers in words, and the page's blocks.
import { useCallback, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Card, useFormatter } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import type { ApiError } from "@/store/api";

/** The countries the platform prices (seed-pricing), for the country filter. */
export const COUNTRIES = ["EG", "SA", "AE", "KW", "QA", "BH", "OM", "DE", "FR", "IT", "CH", "BR", "US"] as const;
/** The currencies those countries bill in. */
export const CURRENCIES = ["EGP", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "EUR", "CHF", "USD"] as const;
/** The tool catalogue's keys (ADM-03), for the tool filter and custom plan requests. */
export const TOOLS = ["general", "tasks", "files", "chat", "hr", "crm", "marketing", "email", "website", "hosting"] as const;

/**
 * Filters and the page live in the address, so a link opens the same view. `set` drops empty
 * values and goes back to page 1 unless the page itself changes.
 */
export function useUrlFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = useCallback((k: string) => params.get(k) ?? "", [params]);
  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "" || v === "all") next.delete(k);
        else next.set(k, String(v));
      }
      if (!("page" in patch)) next.delete("page");
      if (next.get("page") === "1") next.delete("page");
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );
  return { get, set, params };
}

/** A tool's name in the reader's language (catalogue keys), the key itself if unknown. */
export function useToolName() {
  const t = useTranslations("Customers");
  return useCallback((key: string) => (t.has(`tools.${key}`) ? t(`tools.${key}` as never) : key), [t]);
}

/** Country and currency names from the browser's own tables, in the reader's language. */
export function useRegionNames() {
  const locale = useLocale();
  return useMemo(() => {
    let regions: Intl.DisplayNames | null = null;
    let currencies: Intl.DisplayNames | null = null;
    try {
      regions = new Intl.DisplayNames([locale], { type: "region" });
      currencies = new Intl.DisplayNames([locale], { type: "currency" });
    } catch {
      // Old engines: the codes stay.
    }
    return {
      country: (code: string) => (code ? (regions?.of(code) ?? code) : "—"),
      currency: (code: string) => (code ? (currencies?.of(code) ?? code) : "—"),
    };
  }, [locale]);
}

/** What a failed call means, in words, for a message where it happened. */
export function useErrorText() {
  const tc = useTranslations("Common");
  return useCallback(
    (e: unknown) => {
      const err = e as ApiError | undefined;
      if (!err || typeof err !== "object") return tc("saveFailed");
      if (err.status === 409 || err.code === "wrong_state") return tc("wrongState");
      if (err.status === 403) return tc("forbidden");
      if (err.status === 422) return tc("fixFields");
      return tc("saveFailed");
    },
    [tc],
  );
}

/** Money in its currency's decimals, read left to right inside RTL pages. */
export function Money({ amount, currency, className }: { amount: number | null | undefined; currency: string; className?: string }) {
  const f = useFormatter();
  if (amount === null || amount === undefined) return <span className={className}>—</span>;
  return (
    <span dir="ltr" className={["tabular-nums", className].filter(Boolean).join(" ")}>
      {f.money(amount, currency)}
    </span>
  );
}

/** A date in the reader's language, or a dash. */
export function DateText({ value, time = false }: { value: string | null | undefined; time?: boolean }) {
  const f = useFormatter();
  if (!value) return <>—</>;
  return <time dateTime={value}>{f.date(value, time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" })}</time>;
}

/** One block of a detail page, with a real heading so the page reads as an outline. */
export function Section({ id, title, actions, children, className }: { id: string; title: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card padding="md" className={["flex min-w-0 flex-col gap-4", className].filter(Boolean).join(" ")} aria-labelledby={id} role="region">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="font-display text-title-sm text-fg">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </Card>
  );
}

/** Label and value pairs. */
export function Facts({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-body-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">
      {items.map((x, i) => (
        <div key={i} className="contents">
          <dt className="text-fg-muted">{x.label}</dt>
          <dd className="mb-2 min-w-0 break-words text-fg sm:mb-0">{x.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A line of quiet text for a list that has nothing in it. */
export function Nothing({ children }: { children: ReactNode }) {
  return <p className="text-body-sm text-fg-muted">{children}</p>;
}
