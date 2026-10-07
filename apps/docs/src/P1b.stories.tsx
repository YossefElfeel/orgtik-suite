import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Accordion, Button, Collapsible, CollapsiblePanel, CollapsibleTrigger, Field, RadioGroup, ScrollArea, SegmentedControl, Separator, Textarea,
} from "@orgtik/ui";
import { CalendarBlank, CaretDown, ListBullets, SquaresFour } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta = { title: "P1b/Choice and disclosure", parameters: { layout: "padded" } };
export default meta;

const COPY = {
  en: {
    note: "Note for the client", noteHelp: "Shown on the invoice.", visibility: "Who can see this folder",
    options: [["private", "Only me", "Nobody else can open it."], ["team", "My team", "Everyone in Design."], ["all", "Everyone", "All members of the workspace."]],
    view: "View", list: "List", grid: "Grid", range: "Range", day: "Day", week: "Week", month: "Month",
    faq: [["What happens to archived files?", "They stay for 30 days, then they're deleted for good."], ["Can guests download?", "Only when the link allows it."], ["Is there a size limit?", "2 GB per file on every plan."]],
    advanced: "Advanced settings", advancedBody: "Retention, watermarks and link expiry live here.", log: "Activity",
  },
  ar: {
    note: "ملاحظة للعميل", noteHelp: "تظهر على الفاتورة.", visibility: "من يمكنه رؤية هذا المجلد",
    options: [["private", "أنا فقط", "لا يمكن لأحد غيرك فتحه."], ["team", "فريقي", "كل من في فريق التصميم."], ["all", "الجميع", "كل أعضاء مساحة العمل."]],
    view: "طريقة العرض", list: "قائمة", grid: "شبكة", range: "المدة", day: "يوم", week: "أسبوع", month: "شهر",
    faq: [["ماذا يحدث للملفات المؤرشفة؟", "تبقى 30 يومًا ثم تُحذف نهائيًا."], ["هل يمكن للضيوف التنزيل؟", "فقط إذا سمح الرابط بذلك."], ["هل هناك حد للحجم؟", "‏2 غيغابايت لكل ملف في كل الخطط."]],
    advanced: "إعدادات متقدمة", advancedBody: "هنا الاحتفاظ بالملفات والعلامات المائية وانتهاء الروابط.", log: "النشاط",
  },
};

function All() {
  const s = useCopy(COPY);
  const [view, setView] = useState("list");
  const [range, setRange] = useState("week");
  return (
    <div className="grid max-w-3xl gap-8">
      <Field label={s.note} description={s.noteHelp}>
        <Textarea placeholder="…" />
      </Field>
      <Field label={s.visibility}>
        <RadioGroup defaultValue="team" options={s.options.map(([value, label, description]) => ({ value: value!, label, description }))} />
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl label={s.view} value={view} onValueChange={setView} iconOnly segments={[{ value: "list", label: s.list, icon: <ListBullets /> }, { value: "grid", label: s.grid, icon: <SquaresFour /> }]} />
        <SegmentedControl label={s.range} value={range} onValueChange={setRange} segments={[{ value: "day", label: s.day }, { value: "week", label: s.week, icon: <CalendarBlank /> }, { value: "month", label: s.month }]} />
      </div>
      <Separator />
      <Accordion multiple defaultValue={["q0"]} items={s.faq.map(([title, content], i) => ({ value: `q${i}`, title, content }))} />
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="ghost" endIcon={<CaretDown />} />}>{s.advanced}</CollapsibleTrigger>
        <CollapsiblePanel>
          <p className="pt-2 text-body text-fg-muted">{s.advancedBody}</p>
        </CollapsiblePanel>
      </Collapsible>
      <ScrollArea label={s.log} className="h-40 rounded-card border border-line bg-raised">
        <ol className="flex flex-col gap-2 p-4 text-body-sm text-fg-muted">
          {Array.from({ length: 14 }, (_, i) => <li key={i}>{s.log} #{i + 1}</li>)}
        </ol>
      </ScrollArea>
    </div>
  );
}

export const ChoiceAndDisclosure: StoryObj = { render: () => <All /> };
