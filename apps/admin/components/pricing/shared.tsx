"use client";
// Helpers every pricing screen shares: money in a currency's own decimals, country and currency
// names in the person's language, plan labels, the address-held view state, and the notes and
// badges that say what a price is and who may change it.
import { useCallback, useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Eye, PushPin } from "@phosphor-icons/react";
import { Badge, useFormatter } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import type { ApiError, Locale, Localized } from "@/store/api";
import { useCurrenciesQuery, type Currency, type PriceSource, type RoundingMode } from "@/store/pricing";

/** Rounds to a currency's step and mode, then to its decimals: the resolver's own rule (R03-ALG-4), for examples only. */
export function roundStep(amount: number, cur: Pick<Currency, "decimals" | "step" | "mode">) {
  const step = cur.step || 10 ** -cur.decimals;
  const n = amount / step;
  const k = cur.mode === "up" ? Math.ceil(n - 1e-9) : cur.mode === "down" ? Math.floor(n + 1e-9) : Math.round(n);
  const f = 10 ** cur.decimals;
  return Math.round((k * step + Number.EPSILON) * f) / f;
}

/**
 * Money in its currency's decimals as the admin set them (KWD 3), in the person's language and
 * digits. Falls back to the currency's ISO decimals until the currency table has loaded.
 */
export function useMoney() {
  const f = useFormatter();
  const { data } = useCurrenciesQuery();
  const decimals = useMemo(() => new Map((data ?? []).map((c) => [c.code, c.decimals])), [data]);
  return useCallback(
    (amount: number, currency: string) => {
      const d = decimals.get(currency);
      try {
        return d == null ? f.money(amount, currency) : f.number(amount, { style: "currency", currency, minimumFractionDigits: d, maximumFractionDigits: d });
      } catch {
        return `${f.number(amount)} ${currency}`;
      }
    },
    [f, decimals],
  );
}

/** Country and currency names from the browser's own data, in the page's language. */
export function useNames() {
  const locale = useLocale();
  return useMemo(() => {
    const tag = locale === "ar" ? "ar" : locale;
    let regions: Intl.DisplayNames | null = null;
    let currencies: Intl.DisplayNames | null = null;
    try {
      regions = new Intl.DisplayNames([tag], { type: "region" });
      currencies = new Intl.DisplayNames([tag], { type: "currency" });
    } catch {
      // Old browsers: the codes alone.
    }
    return {
      country: (iso: string, fallback?: string) => {
        try {
          return regions?.of(iso) ?? fallback ?? iso;
        } catch {
          return fallback ?? iso;
        }
      },
      currency: (code: string, fallback?: string) => {
        try {
          const n = currencies?.of(code);
          return n && n !== code ? n : fallback ?? code;
        } catch {
          return fallback ?? code;
        }
      },
    };
  }, [locale]);
}

/** A localized value in the page's language, English when that language is missing. */
export function useLocalizedText() {
  const locale = useLocale() as Locale;
  return useCallback((v: Partial<Localized> | undefined | null) => (v ? v[locale]?.trim() || v.en || "" : ""), [locale]);
}

/** "Chat · Pro": the tool's name and the plan's, so plans of different tools never read the same. */
export function usePlanLabel() {
  const t = useTranslations("Pricing");
  const text = useLocalizedText();
  return useCallback(
    (plan: { tool: string | null; name?: Partial<Localized> | null; id: string }) => {
      const tool = plan.tool ? (t.has(`tools.${plan.tool}`) ? t(`tools.${plan.tool}` as "tools.chat") : plan.tool) : "";
      const name = text(plan.name) || plan.id;
      return tool ? `${tool} · ${name}` : name;
    },
    [t, text],
  );
}

/** View state kept in the address (?tool=…&page=…), so a link opens the same view. */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = useCallback((k: string) => params.get(k) ?? "", [params]);
  const set = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      const p = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === undefined || v === "") p.delete(k);
        else p.set(k, String(v));
      }
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );
  return { get, set };
}

/** Said at the top of a pricing page when the person's role may look but not change anything. */
export function ViewOnlyNote() {
  const tc = useTranslations("Common");
  return (
    <p role="note" className="flex items-center gap-2 rounded-card border border-line bg-sunken px-4 py-3 text-body-sm text-fg-muted">
      <Eye aria-hidden="true" className="size-4 shrink-0" />
      {tc("viewOnly")}
    </p>
  );
}

/** Where a resolved price came from (R03-ALG): a country's fixed price is an override, in brand violet (D-045). */
export function SourceBadge({ source }: { source: PriceSource }) {
  const t = useTranslations("Pricing.source");
  const key = ({ Private: "private", Country: "country", Zone: "zone", "Zone (converted)": "converted", Default: "default" } as const)[source] ?? "zone";
  if (source === "Country") return <OverrideBadge>{t(key)}</OverrideBadge>;
  return (
    <Badge size="sm" tone={source === "Default" ? "neutral" : source === "Private" ? "warning" : "info"} emphasis="subtle">
      {t(key)}
    </Badge>
  );
}

/** A country's own price or currency, set apart from the zone's: brand violet, a pin and a word (D-045). */
export function OverrideBadge({ children }: { children: ReactNode }) {
  return (
    <Badge size="sm" tone="brand" emphasis="subtle" icon={<PushPin weight="fill" />}>
      {children}
    </Badge>
  );
}

export const MODES: RoundingMode[] = ["nearest", "up", "down"];

/** The 422's field errors, or nothing: screens put each on its own field. */
export const fieldErrorsOf = (e: unknown) => ((e && typeof e === "object" && "fieldErrors" in e ? (e as ApiError).fieldErrors : undefined) ?? {}) as Record<string, string>;
export const codeOf = (e: unknown) => (e && typeof e === "object" && "code" in e ? (e as ApiError).code : undefined);
