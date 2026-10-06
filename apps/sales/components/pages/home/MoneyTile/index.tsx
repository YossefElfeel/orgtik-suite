"use client";

// A money figure on the dashboard. Sales are made in several currencies (one per zone) and the API
// doesn't convert them, so the tile lists one total per currency, each in its own currency
// (f.money in the reader's language; zero-decimal currencies come out right), and says they
// aren't converted. With one currency it's an ordinary Stat with its change in words.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Minus } from "@phosphor-icons/react";
import { Stat, cn, useFormatter, useStrings } from "@orgtik/ui";
import { growthChange, periodKey } from "@/components/pages/home/growth";
import type { ZoneGrowthMetric } from "@/types/money";

type Props = {
  label: ReactNode;
  icon?: ReactNode;
  groups: ZoneGrowthMetric[] | undefined;
  loading?: boolean;
  /** Which way is good news (commissions paid out: neither, so leave "up"). */
  good?: "up" | "down";
};

function Delta({ metric, good = "up" }: { metric: ZoneGrowthMetric; good?: "up" | "down" }) {
  const lib = useStrings();
  const f = useFormatter();
  if (!metric.previousPeriod) return null;
  const v = (metric.growthPercent ?? 0) / 100;
  const dir = v === 0 ? "flat" : v > 0 ? "up" : "down";
  const ok = dir !== "flat" && dir === good;
  return (
    <span className={cn("inline-flex items-center gap-1 text-body-sm font-medium", dir === "flat" ? "text-fg-muted" : ok ? "text-success" : "text-danger")}>
      <span aria-hidden="true" className="[&>svg]:size-4 rtl:[&>svg]:-scale-x-100">
        {dir === "up" ? <ArrowUpRight weight="bold" /> : dir === "down" ? <ArrowDownRight weight="bold" /> : <Minus weight="bold" />}
      </span>
      {dir === "flat" ? lib("statFlat") : lib(dir === "up" ? "statUp" : "statDown", { amount: f.percent(Math.abs(v), 1) })}
    </span>
  );
}

export default function MoneyTile({ label, icon, groups, loading, good = "up" }: Props) {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  const list = groups ?? [];

  if (loading || list.length === 0) {
    return <Stat label={label} icon={icon} loading={loading} value={<span className="text-fg-muted">—</span>} hint={loading ? undefined : t("noMoneyYet")} />;
  }

  if (list.length === 1) {
    const g = list[0];
    return (
      <Stat
        label={label}
        icon={icon}
        value={f.money(g.total, g.currencyCode)}
        change={(() => {
          const c = growthChange(g, t(`against.${periodKey(g.comparisonPeriod)}`));
          return c ? { ...c, good } : undefined;
        })()}
      />
    );
  }

  return (
    <Stat
      label={label}
      icon={icon}
      value={
        <ul className="flex flex-col gap-1.5">
          {list.map((g) => (
            <li key={`${g.zoneId ?? "none"}-${g.currencyCode}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="text-title-sm">{f.money(g.total, g.currencyCode)}</span>
              <Delta metric={g} good={good} />
            </li>
          ))}
        </ul>
      }
      hint={t(`notConverted.${periodKey(list[0]?.comparisonPeriod)}`)}
    />
  );
}
