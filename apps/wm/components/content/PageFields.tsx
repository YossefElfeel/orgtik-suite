"use client";
import { Field, Input, Textarea } from "@orgtik/ui";
import { useTranslations } from "next-intl";
import { ValueEditor, type EditorContext } from "./BlockEditor";
import type { Node } from "@/lib/caseStudySchema";
import type { Entry, Locale } from "@/store/api";

export type PageField = { record: string; path: string; label: string; initial?: string; link?: boolean; template?: boolean };
export function PageFields({ fields, records, lang, edits, onChange, ctx }: {
  fields: PageField[]; records: Entry[]; lang: Locale;
  edits: Record<string, Partial<Record<Locale, Record<string, unknown>>>>;
  onChange: (id: string, words: Record<string, unknown>) => void; ctx: EditorContext;
}) {
  const t = useTranslations("Fields");
  const ti = useTranslations("Improvements");
  return <div className="grid max-w-3xl gap-4">
    {fields.map(field => {
      const entry = records.find(item => item.id === field.record);
      if (!entry) return null;
      const [block, slot] = field.path.split(".");
      const words = edits[field.record]?.[lang] ?? entry.content.locales[lang] ?? entry.content.locales.en ?? {};
      const values = (words[block] ?? {}) as Record<string, unknown>;
      const fallback = (entry.content.locales.en?.[block] ?? {}) as Record<string, unknown>;
      const value = values[slot] ?? (lang === "en" ? field.initial : undefined) ?? "";
      if (!field.link && /<m\d+>|<br\s*\/?>/.test(String(value))) return <ValueEditor key={`${field.record}.${field.path}`} node={{kind:"rich",label:field.label,long:String(value).length>100}} value={value} fallback={fallback[slot]} path={field.path} onChange={next=>onChange(field.record,{...words,[block]:{...values,[slot]:next}})} ctx={ctx} />;
      return <Field key={`${field.record}.${field.path}`} label={t.has(field.label) ? t(field.label) : field.label} description={field.template ? ti("templateField") : undefined}>
        {field.label === "subheading" ? <Textarea rows={3} value={String(value)} placeholder={String(fallback[slot] ?? field.initial ?? "")} dir="auto" lang={lang} disabled={ctx.readOnly} onChange={event=>onChange(field.record,{...words,[block]:{...values,[slot]:event.target.value}})} /> : <Input value={String(value)} placeholder={String(fallback[slot] ?? field.initial ?? "")} dir={field.link ? "ltr" : "auto"} lang={lang} readOnly={field.template} disabled={ctx.readOnly || field.link && ctx.structureLocked} onChange={event => onChange(field.record, { ...words, [block]: { ...values, [slot]: event.target.value } })} />}
      </Field>;
    })}
  </div>;
}

/** Cards share the original flat copy keys; visual grouping never changes saved content. */
export function PageCards({ pageId, section, node, value, onChange, ctx }: {pageId: string; section: string; node: Node; value: unknown; onChange: (value: unknown) => void; ctx: EditorContext}) {
  const t = useTranslations("Fields");
  if (node.kind !== "group") return null;
  const groups = pageId === "pg_home" ? [
    { label: "sectionIntro", keys: ["div", "h2", "p"] },
    { label: "buildGrow", keys: ["image-slot@placeholder", "div-2", "div-3", "h3", "p-2", "li", "li-2", "li-3", "li-4", "li-5"] },
    { label: "runBetter", keys: ["image-slot@placeholder-2", "div-4", "div-5", "h3-2", "p-3", "li-6", "li-7", "li-8", "li-9", "li-10", "li-11"] },
  ] : [
    { label: "sectionIntro", keys: ["div", "h2", "p"] },
    { label: "purpose", keys: ["image-slot@placeholder", "h3", "p-2"] },
    ...[2, 3, 4].map((n, index) => ({ label: `goal${index + 1}`, keys: [`div-${n}`] })),
  ];
  return <div className="flex flex-col gap-5">{groups.map(group => <section key={group.label} className="rounded-card border border-line bg-raised p-5">
    <h3 className="mb-4 text-title-sm font-semibold">{t(group.label)}</h3>
    <ValueEditor node={{ kind: "group", fields: Object.fromEntries(group.keys.filter(key => node.fields[key]).map(key => [key, node.fields[key]])) }} value={value} onChange={onChange} path={section} ctx={ctx} />
  </section>)}</div>;
}
