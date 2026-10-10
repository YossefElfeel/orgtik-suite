"use client";import{KpiCard}from"@orgtik/ui";
export interface StatProps {
  label: string;
  /** Pre-formatted, so each tile decides its own units. */
  value: string;
  /** Optional supporting line under the value. */
  meta?: string;
  /** Percentage change against the previous period. Omit if not measured. */
  deltaPct?: number;
  /** What the delta is measured against, e.g. "last week". Required with one. */
  deltaAgainst?: string;
  /**
   * Whether a rise is a good thing. Left undefined the delta stays neutral,
   * which is the honest default for a measure with no preferred direction.
   */
  riseIsGood?: boolean;
  /** A short series for a sparkline. Twelve points or fewer reads best. */
  trend?: number[];
  /** Secondary figures sit in a quieter, smaller tile. */
  size?: "md" | "sm";
}

export function Stat({label,value,meta,deltaPct,deltaAgainst,riseIsGood,trend}:StatProps){return <KpiCard label={label} value={value} hint={meta} sparkline={trend} change={deltaPct!==undefined?{value:deltaPct/100,against:deltaAgainst,good:riseIsGood===false?'down':'up'}:undefined}/>;}export function StatRow({children}:{children:React.ReactNode}){return <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>{children}</div>;}