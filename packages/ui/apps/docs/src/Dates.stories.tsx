import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "@orgtik/ui";
import { Calendar, DatePicker, DateRangePicker, DateTimePicker, type DateRange } from "@orgtik/ui/dates";
import { useCopy } from "./copy";

const meta: Meta = { title: "P1b/Dates", parameters: { layout: "padded" } };
export default meta;

// Fixed values: a calendar with no value opens on today, which would change the baseline monthly.
const COPY = {
  en: { due: "Due date", leave: "Leave", schedule: "Schedule" },
  ar: { due: "تاريخ الاستحقاق", leave: "الإجازة", schedule: "الجدول" },
};

function All() {
  const s = useCopy(COPY);
  const [due, setDue] = useState<string | null>("2026-10-15");
  const [leave, setLeave] = useState<DateRange | null>({ start: "2026-10-05", end: "2026-10-09" });
  return (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <Field label={s.due}><DatePicker value={due} onChange={setDue} min="2026-09-30" /></Field>
      <Field label={s.leave}><DateRangePicker value={leave} onChange={setLeave} /></Field>
      <div className="sm:col-span-2">
        <p className="mb-2 text-label text-fg">{s.schedule}</p>
        <Calendar label={s.schedule} defaultValue="2026-10-15" isDateUnavailable={(d) => [0, 6].includes(new Date(d + "T00:00:00").getDay())} />
      </div>
    </div>
  );
}

export const DatesStory: StoryObj = { name: "Dates", render: () => <All /> };

function Instant() {
  const s = useCopy({ en: ["Link expires", "Pick when it stops working."], ar: ["تنتهي صلاحية الرابط", "اختر متى يتوقف عن العمل."] });
  // A fixed instant, so the baseline doesn't move; it's shown in the viewer's time zone.
  const [value, setValue] = useState<string | null>("2026-10-08T07:30:00.000Z");
  return (
    <div className="max-w-md">
      <Field label={s[0]} description={s[1]}>
        <DateTimePicker value={value} onChange={setValue} min="2026-10-01T00:00:00.000Z" />
      </Field>
    </div>
  );
}
/** A date and a time as one stored instant, shown in the viewer's time zone. */
export const DateTime: StoryObj = { name: "Date and time", render: () => <Instant /> };
