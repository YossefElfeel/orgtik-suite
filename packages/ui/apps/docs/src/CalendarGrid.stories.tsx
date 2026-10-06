import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDate } from "@internationalized/date";
import { CalendarGrid, type CalendarEvent } from "@orgtik/ui/dates";
import { useCopy } from "./copy";

// A fixed month and a fixed "today": a calendar on the real date would change its baseline daily.
const TODAY = new CalendarDate(2026, 10, 14);

const COPY = {
  en: ["Sprint review", "Design QA", "Mona on leave", "Release 2.4", "Board meeting", "Pricing workshop", "Payroll run", "Website freeze", "Team lunch", "Security training", "Customer call", "Retro", "Planning", "Interviews"],
  ar: ["مراجعة السباق", "مراجعة جودة التصميم", "إجازة منى", "إصدار 2.4", "اجتماع مجلس الإدارة", "ورشة الأسعار", "صرف الرواتب", "تجميد الموقع", "غداء الفريق", "تدريب الأمان", "مكالمة عميل", "اجتماع المراجعة", "التخطيط", "مقابلات"],
};

function useEvents(many: boolean): CalendarEvent[] {
  const s = useCopy(COPY);
  const base: CalendarEvent[] = [
    { id: "e1", title: s[0]!, start: "2026-10-02", tone: "brand" },
    { id: "e2", title: s[1]!, start: "2026-10-06", tone: "info" },
    { id: "e3", title: s[2]!, start: "2026-10-07", end: "2026-10-13", tone: "warning" },
    { id: "e4", title: s[3]!, start: "2026-10-14", tone: "success" },
    { id: "e5", title: s[4]!, start: "2026-10-14", tone: "neutral" },
    { id: "e6", title: s[5]!, start: "2026-10-20", end: "2026-10-21", tone: "brand" },
    { id: "e7", title: s[6]!, start: "2026-10-27", tone: "danger" },
    { id: "e8", title: s[7]!, start: "2026-10-29", end: "2026-11-03", tone: "info" },
  ];
  if (!many) return base;
  return [
    ...base,
    ...[8, 9, 10, 11, 12, 13].map((i) => ({ id: `m${i}`, title: s[i]!, start: "2026-10-14", tone: (["info", "brand", "success", "neutral", "warning", "danger"] as const)[i % 6] })),
  ];
}

type Harness = { selected: string[]; opened: string[] };
const harness = (): Harness => {
  const w = window as unknown as { __orgtikCalendar?: Harness };
  return (w.__orgtikCalendar ??= { selected: [], opened: [] });
};

function Calendar({ view = "month", many = false, status = "ready" }: { view?: "month" | "week"; many?: boolean; status?: "loading" | "error" | "ready" }) {
  const events = useEvents(many);
  const [month, setMonth] = useState(view === "week" ? TODAY : new CalendarDate(2026, 10, 1));
  return (
    <CalendarGrid
      view={view}
      month={month}
      onMonthChange={setMonth}
      events={events}
      timeZone="Africa/Cairo"
      today={TODAY}
      status={status}
      onRetry={() => {}}
      onSelectDay={(d) => harness().selected.push(d.toString())}
      onOpenEvent={(e) => harness().opened.push(e.id)}
    />
  );
}

const meta: Meta<typeof Calendar> = { title: "Data/CalendarGrid", component: Calendar, parameters: { layout: "padded" } };
export default meta;
type Story = StoryObj<typeof Calendar>;

/** October 2026. The week starts on the language's first day: Monday in en (en-GB), Saturday in ar. */
export const Month: Story = {};
export const Week: Story = { args: { view: "week" } };
/** More events on a day than fit: "+N more" opens the whole list. */
export const ManyEvents: Story = { args: { many: true } };
/** Under 40rem the grid becomes an agenda, a list by day. */
export const PhoneAgenda: Story = { render: (args) => <div className="max-w-[360px]"><Calendar {...args} /></div> };
export const Loading: Story = { args: { status: "loading" } };
