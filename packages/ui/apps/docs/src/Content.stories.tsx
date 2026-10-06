import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, FileField, FilterChips, LimitMeter, LocalizedField, Meter, Progress, Tag, useFormatter, type LocalizedValue } from "@orgtik/ui";
import { useCopy } from "./copy";

const meta: Meta = { title: "P1b/Content and limits", parameters: { layout: "padded" } };
export default meta;

const COPY = {
  en: {
    title: "Service title", arError: "Enter the Arabic title before publishing.", upload: "Upload", importing: "Importing contacts", storage: "Storage used",
    seats: "Seats", storageLimit: "Storage", projects: "Projects", addSeats: "Add seats", status: "Status", open: "Open", overdue: "Overdue", done: "Done",
    tags: ["Q3", "Finance", "Board"], files: "Attachments", filesHelp: "PDF or images, up to 10 MB each.",
  },
  ar: {
    title: "عنوان الخدمة", arError: "أدخل العنوان بالعربية قبل النشر.", upload: "رفع", importing: "جارٍ استيراد جهات الاتصال", storage: "التخزين المستخدَم",
    seats: "المقاعد", storageLimit: "التخزين", projects: "المشروعات", addSeats: "إضافة مقاعد", status: "الحالة", open: "مفتوحة", overdue: "متأخرة", done: "منجزة",
    tags: ["الربع الثالث", "المالية", "مجلس الإدارة"], files: "المرفقات", filesHelp: "ملفات PDF أو صور، حتى 10 ميغابايت لكل ملف.",
  },
};

function All() {
  const s = useCopy(COPY);
  const f = useFormatter();
  const [title, setTitle] = useState<LocalizedValue>({ en: "Brand development", de: "Markenentwicklung" });
  const [filters, setFilters] = useState<string[]>(["overdue"]);
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="grid max-w-3xl gap-8">
      <LocalizedField label={s.title} value={title} onChange={setTitle} errors={{ ar: s.arError }} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Progress label={s.importing} value={64} />
        <Meter label={s.storage} value={0.42} max={1} format={{ style: "percent" }} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <LimitMeter label={s.seats} used={12} limit={25} />
        <LimitMeter label={s.seats} used={21} limit={25} action={<Button size="sm" variant="secondary">{s.addSeats}</Button>} />
        <LimitMeter label={s.storageLimit} used={10 * 1024 ** 3} limit={10 * 1024 ** 3} unit={(n) => f.bytes(n)} />
        <LimitMeter label={s.projects} used={23} limit={20} action={<Button size="sm">{s.addSeats}</Button>} />
      </div>
      <FilterChips label={s.status} value={filters} onValueChange={setFilters} chips={[{ value: "open", label: s.open, count: 18 }, { value: "overdue", label: s.overdue, count: 3 }, { value: "done", label: s.done }]} />
      <div className="flex flex-wrap gap-2">{s.tags.map((t) => <Tag key={t} onRemove={() => {}}>{t}</Tag>)}</div>
      <FileField label={s.files} description={s.filesHelp} value={files} onChange={setFiles} accept="application/pdf,image/*" maxSize={10 * 1024 * 1024} />
    </div>
  );
}

export const ContentAndLimits: StoryObj = { render: () => <All /> };
