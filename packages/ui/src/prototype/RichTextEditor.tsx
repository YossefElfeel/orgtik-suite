"use client";
import { ListBullets, TextB, TextItalic } from "@phosphor-icons/react";
import { Button } from "../components/Button.js";
import { Field } from "../components/Field.js";
import { Textarea } from "../components/Input.js";
import { useOrgtik } from "../provider/OrgtikProvider.js";

export type RichTextFormat = { bold: boolean; italic: boolean; bullets: boolean };
const labels = { en: ["Bold message", "Italic message", "Each line as a bullet"], ar: ["رسالة بخط عريض", "رسالة بخط مائل", "كل سطر كنقطة"], de: ["Nachricht fett", "Nachricht kursiv", "Jede Zeile als Aufzählung"], fr: ["Message en gras", "Message en italique", "Chaque ligne en puce"], it: ["Messaggio in grassetto", "Messaggio in corsivo", "Ogni riga come punto"] } as const;
/** Plain text with explicit formatting flags; never interprets user HTML. */
export function RichTextEditor({ label, value, onChange, format, onFormatChange, placeholder, disabled, rows = 3, maxLength = 10000, error, onBlur }: { label: string; value: string; onChange: (value: string) => void; format: RichTextFormat; onFormatChange: (format: RichTextFormat) => void; placeholder?: string; disabled?: boolean; rows?: number; maxLength?: number; error?: string; onBlur?: () => void }) {
  const { locale } = useOrgtik(), words = labels[locale];
  return <div className="flex flex-col gap-2"><Field label={label} error={error}><Textarea dir="auto" value={value} disabled={disabled} rows={rows} maxLength={maxLength} onBlur={onBlur} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={`${format.bold ? "font-bold" : ""} ${format.italic ? "italic" : ""}`} /></Field><div className="flex flex-wrap gap-1">{(["bold", "italic", "bullets"] as const).map((key, index) => <Button key={key} type="button" variant={format[key] ? "secondary" : "ghost"} size="sm" disabled={disabled} aria-pressed={format[key]} aria-label={words[index]} onClick={() => onFormatChange({ ...format, [key]: !format[key] })}>{index === 0 ? <TextB /> : index === 1 ? <TextItalic /> : <ListBullets />}</Button>)}</div></div>;
}
