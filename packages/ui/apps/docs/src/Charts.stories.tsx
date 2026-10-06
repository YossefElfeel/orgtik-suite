import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat, useFormatter } from "@orgtik/ui";
import { BarChart, DonutChart, LineChart } from "@orgtik/ui/charts";
import { ChatCircleText, Eye, UsersThree } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta = { title: "Data/Charts", parameters: { layout: "padded" } };
export default meta;

// Fixed sample numbers, so the pixel baselines don't move.
const DAYS = Array.from({ length: 14 }, (_, i) => ({
  day: `2026-09-${String(i + 17).padStart(2, "0")}`,
  visits: [412, 438, 390, 455, 501, 322, 298, 470, 489, 512, 530, 344, 310, 556][i],
  leads: [6, 8, 5, 9, 11, 3, 2, 10, 9, 12, 13, 4, 3, 14][i],
}));

function Stats() {
  const f = useFormatter();
  const s = useCopy({
    en: ["Visits", "Leads", "Visitors", "vs the previous 14 days", "Contact form and plan requests"],
    ar: ["الزيارات", "العملاء المحتملون", "الزوار", "مقارنة بالأيام الـ 14 السابقة", "نموذج التواصل وطلبات الخطط"],
  });
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
      <Stat label={s[0]} icon={<Eye />} value={f.number(6027)} change={{ value: 0.124, against: s[3] }} />
      <Stat label={s[1]} icon={<ChatCircleText />} value={f.number(109)} change={{ value: -0.06, against: s[3] }} hint={s[4]} />
      <Stat label={s[2]} icon={<UsersThree />} value={f.number(4210)} change={{ value: 0, against: s[3] }} />
      <Stat label={s[0]} value="" loading />
    </div>
  );
}
export const Stats_: StoryObj = { name: "Stats", render: () => <Stats /> };

function Lines() {
  const f = useFormatter();
  const s = useCopy({
    en: ["Visits and leads", "The last 14 days", "Day", "Visits", "Leads"],
    ar: ["الزيارات والعملاء المحتملون", "آخر 14 يومًا", "اليوم", "الزيارات", "العملاء المحتملون"],
  });
  const day = (v: string | number) => f.date(`${v}T00:00:00`, { day: "numeric", month: "short" });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <LineChart title={s[0]} description={s[1]} data={DAYS} x={{ key: "day", label: s[2], format: day }} series={[{ key: "visits", label: s[3] }, { key: "leads", label: s[4] }]} />
      <LineChart area title={s[3]} description={s[1]} data={DAYS} x={{ key: "day", label: s[2], format: day }} series={[{ key: "visits", label: s[3] }]} />
    </div>
  );
}
export const Lines_: StoryObj = { name: "Line and area", render: () => <Lines /> };

function Bars() {
  const s = useCopy({
    en: ["Most visited pages", "Visits", "Page", "Leads by source", "Month", "Contact form", "Plan builder"],
    ar: ["أكثر الصفحات زيارة", "الزيارات", "الصفحة", "العملاء المحتملون حسب المصدر", "الشهر", "نموذج التواصل", "منشئ الخطط"],
  });
  const pages = [
    { page: "/software", visits: 1840 },
    { page: "/services", visits: 1512 },
    { page: "/work/orgtik-identity-system", visits: 944 },
    { page: "/insights/connected-digital-system", visits: 610 },
    { page: "/contact", visits: 402 },
  ];
  const months = [
    { month: "Jun", form: 18, builder: 9 },
    { month: "Jul", form: 22, builder: 14 },
    { month: "Aug", form: 19, builder: 21 },
    { month: "Sep", form: 27, builder: 30 },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BarChart layout="rows" title={s[0]} data={pages} x={{ key: "page", label: s[2] }} series={[{ key: "visits", label: s[1] }]} />
      <BarChart stacked title={s[3]} data={months} x={{ key: "month", label: s[4] }} series={[{ key: "form", label: s[5] }, { key: "builder", label: s[6] }]} />
    </div>
  );
}
export const Bars_: StoryObj = { name: "Bars", render: () => <Bars /> };

function Donut() {
  const s = useCopy({
    en: ["Where leads come from", "Leads", "Source", "Search", "Direct", "Social", "Referral"],
    ar: ["من أين يأتي العملاء المحتملون", "العملاء المحتملون", "المصدر", "البحث", "مباشر", "التواصل الاجتماعي", "إحالة"],
  });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DonutChart
        title={s[0]}
        totalLabel={s[1]}
        categoryLabel={s[2]}
        valueLabel={s[1]}
        data={[
          { key: "search", label: s[3], value: 48 },
          { key: "direct", label: s[4], value: 31 },
          { key: "social", label: s[5], value: 19 },
          { key: "referral", label: s[6], value: 11 },
        ]}
      />
      <div className="grid gap-4">
        <LineChart loading title={s[0]} data={[]} x={{ key: "d", label: "" }} series={[]} height={120} />
        <LineChart title={s[0]} data={[]} x={{ key: "d", label: "" }} series={[]} height={120} />
        <LineChart error onRetry={() => {}} title={s[0]} data={[]} x={{ key: "d", label: "" }} series={[]} height={120} />
      </div>
    </div>
  );
}
export const DonutAndStates: StoryObj = { name: "Donut and states", render: () => <Donut /> };
