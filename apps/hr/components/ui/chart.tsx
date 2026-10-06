"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

const ChartConfigContext = React.createContext<ChartConfig | null>(null);

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactNode;
}) {
  const style = React.useMemo(() => {
    const entries = Object.entries(config).map(([key, value]) => [
      `--color-${key}`,
      value.color,
    ]);
    return Object.fromEntries(entries) as React.CSSProperties;
  }, [config]);

  return (
    <ChartConfigContext.Provider value={config}>
      <div className={className} style={style}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartConfigContext.Provider>
  );
}

export function ChartTooltip(props: TooltipProps<any, any>) {
  return <Tooltip {...props} />;
}

export function ChartTooltipContent({
  hideLabel,
  className,
  payload,
}: TooltipProps<number, string> & {
  hideLabel?: boolean;
  className?: string;
  payload?: any;
}) {
  const config = React.useContext(ChartConfigContext);

  if (!payload || payload.length === 0) return null;

  const item = payload[0];
  const key = String((item as any)?.dataKey ?? (item as any)?.name ?? "");
  const series = config?.[key];

  const value = (item as any)?.value;
  const label = series?.label ?? String((item as any)?.name ?? key);
  const color =
    series?.color ?? (item as any)?.color ?? "var(--muted-foreground)";

  return (
    <div className={className ?? ""}>
      {!hideLabel && (
        <div className="flex items-center gap-2 mb-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-caption text-secondary">{label}</span>
        </div>
      )}
      <div className="text-body font-medium">{value}</div>
    </div>
  );
}
