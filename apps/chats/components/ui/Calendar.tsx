"use client";import{CalendarGrid}from'@orgtik/ui/dates';import{parseDate}from'@internationalized/date';import{useT}from'@/lib/i18n';import{fromKey,toKey,type DateKey}from'@/lib/analytics';export interface YearMonth{year:number;month:number}export const monthOf=(key:DateKey):YearMonth=>{const d=fromKey(key);return{year:d.getFullYear(),month:d.getMonth()};};export const shiftMonth=(m:YearMonth,by:number):YearMonth=>{const d=new Date(m.year,m.month+by,1);return{year:d.getFullYear(),month:d.getMonth()};};export const sameMonth=(a:YearMonth,b:YearMonth)=>a.year===b.year&&a.month===b.month;
export interface MonthGridProps {
  month: YearMonth;
  today: DateKey;
  /** Inclusive span drawn as selected. A single day has from === to. */
  range?: { from: DateKey; to: DateKey } | null;
  /** A first click waiting for its second, drawn as a lone endpoint. */
  pending?: DateKey | null;
  /** The day under the pointer while a second click is pending. */
  preview?: DateKey | null;
  onPreview?: (day: DateKey | null) => void;
  onPick: (day: DateKey) => void;
  /** Days that may be picked. Outside them a day is shown but inert. */
  min?: DateKey;
  max?: DateKey;
  marks?: Record<DateKey, number>;
  /** Shared approved availability, kept distinct from the meeting count. */
  availabilityMarks?: Record<DateKey, number>;
  /** The day holding the tab stop; defaults to the first selectable day. */
  focusDay?: DateKey | null;
  onFocusDay?: (day: DateKey) => void;
  onMonthChange?: (m: YearMonth) => void;
  showNav?: boolean;
  label?: string;
  /** Cell size in px. 36 for pickers, 44 for a calendar that shows marks. */
  cell?: number;
}

export function MonthGrid({month,today,onPick,onMonthChange,marks={},availabilityMarks={},min,max}:MonthGridProps){const t=useT(),events=[...Object.entries(marks).filter(([,n])=>n>0).map(([day,n])=>({id:'meetings:'+day,start:day,title:t('v3.meetingCount','{n} meetings',{n}),tone:'brand' as const})),...Object.entries(availabilityMarks).filter(([,n])=>n>0).map(([day,n])=>({id:'availability:'+day,start:day,title:t('v3.absenceCount','{n} approved absences',{n}),tone:'neutral' as const}))];return <CalendarGrid month={parseDate(toKey(new Date(month.year,month.month,1)))} onMonthChange={d=>onMonthChange?.({year:d.year,month:d.month-1})} today={parseDate(today)} timeZone='Africa/Cairo' events={events} onSelectDay={d=>{const day=d.toString()as DateKey;if((!min||day>=min)&&(!max||day<=max))onPick(day);}} onOpenEvent={e=>onPick(e.start as DateKey)}/>;}