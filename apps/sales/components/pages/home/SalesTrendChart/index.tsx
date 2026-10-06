"use client";

// Sales over the last twelve months (FS-SAL-10). The old chart (recharts, hex colours) plotted every
// currency on one axis and labelled months with the API's English "Jan 26". Now it's the library's
// LineChart with its table view, one currency at a time (a switch picks it; amounts aren't
// converted between currencies), and the months read in the reader's language.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SegmentedControl, useFormatter } from "@orgtik/ui";
import { LineChart } from "@orgtik/ui/charts";
import { useFormatTag } from "@/components/pages/activity-feed/feed";
import type { ZoneSalesTrendSeries } from "@/types/money";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A point's month as YYYY-MM. The API sends `key` when it can (requested); otherwise the series
 * starts at `from` and runs a month per point; as a last resort its English "Jan 26" is read.
 */
function monthOf(point: { month: string; key?: string }, index: number, from?: string): string | null {
  if (point.key && /^\d{4}-\d{2}$/.test(point.key)) return point.key;
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + index, 1));
      return `${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, "0")}`;
    }
  }
  const match = /^([A-Za-z]{3})\s+(\d{2})$/.exec(point.month.trim());
  const mi = match ? MONTHS.indexOf(match[1]) : -1;
  return match && mi >= 0 ? `20${match[2]}-${String(mi + 1).padStart(2, "0")}` : null;
}

type Props = {
  series: ZoneSalesTrendSeries[] | undefined;
  /** The first month (ISO), from the API's `salesTrend.from`. */
  from?: string;
  title?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  className?: string;
};

export default function SalesTrendChart({ series, from, title, loading, error, onRetry, className }: Props) {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  const tag = useFormatTag();
  const list = useMemo(() => series ?? [], [series]);
  const currencies = useMemo(() => [...new Set(list.map((s) => s.currencyCode))], [list]);
  const [picked, setPicked] = useState<string | null>(null);
  const currency = picked && currencies.includes(picked) ? picked : currencies[0];
  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames(tag, { type: "currency" });
    } catch {
      return null;
    }
  }, [tag]);

  const rows = useMemo(() => {
    const months = new Map<string, number>();
    for (const s of list.filter((x) => x.currencyCode === currency)) {
      s.points.forEach((p, i) => {
        const key = monthOf(p as { month: string; key?: string }, i, from);
        if (key) months.set(key, (months.get(key) ?? 0) + (Number(p.amount) || 0));
      });
    }
    return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));
  }, [currency, from, list]);

  const monthLabel = (v: string | number) => {
    const [y, m] = String(v).split("-").map(Number);
    if (!y || !m) return String(v);
    return f.date(Date.UTC(y, m - 1, 1), { month: "short", year: "2-digit", timeZone: "UTC" });
  };

  return (
    <LineChart
      area
      className={className}
      title={title ?? t("salesTrendTitle")}
      description={currency ? t("salesTrendBody", { currency: names?.of(currency) ?? currency }) : undefined}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyText={t("salesTrendEmpty")}
      actions={
        currencies.length > 1 ? (
          <SegmentedControl
            size="sm"
            label={t("currency")}
            value={currency}
            onValueChange={setPicked}
            segments={currencies.map((c) => ({ value: c, label: <bdi dir="ltr">{c}</bdi> }))}
          />
        ) : null
      }
      data={rows.some((r) => r.amount) ? rows : []}
      x={{ key: "month", label: t("month"), format: monthLabel }}
      series={[{ key: "amount", label: t("sales") }]}
      valueFormat={currency ? { style: "currency", currency, maximumFractionDigits: 0 } : { maximumFractionDigits: 0 }}
    />
  );
}
