import { Button, IconButton } from "@orgtik/ui";

const t = {
  en: { save: "Save", cancel: "Cancel", del: "Delete", more: "View plans", start: "Start trial", title: "Buttons", more_label: "More actions" },
  ar: { save: "حفظ", cancel: "إلغاء", del: "حذف", more: "عرض الخطط", start: "ابدأ التجربة", title: "الأزرار", more_label: "إجراءات أخرى" },
};
const Dots = () => (<svg viewBox="0 0 256 256" width="1em" height="1em" fill="currentColor"><circle cx="128" cy="60" r="16" /><circle cx="128" cy="128" r="16" /><circle cx="128" cy="196" r="16" /></svg>);

export default async function Page({ params }) {
  const { locale } = await params;
  const s = t[locale] || t.en;
  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-8">
      <h1 className="font-display text-title-lg">{s.title}</h1>
      {["sm", "md", "lg"].map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-raised p-4">
          <Button size={size}>{s.save}</Button>
          <Button size={size} variant="secondary">{s.cancel}</Button>
          <Button size={size} variant="ghost">{s.cancel}</Button>
          <Button size={size} variant="danger">{s.del}</Button>
          <Button size={size} variant="brand">{s.start}</Button>
          <Button size={size} variant="link">{s.more}</Button>
          <Button size={size} loading>{s.save}</Button>
          <IconButton size={size} label={s.more_label} icon={<Dots />} />
        </div>
      ))}
    </main>
  );
}
