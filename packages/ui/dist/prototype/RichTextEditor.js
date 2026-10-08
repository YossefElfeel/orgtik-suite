"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ListBullets, TextB, TextItalic } from "@phosphor-icons/react";
import { Button } from "../components/Button.js";
import { Field } from "../components/Field.js";
import { Textarea } from "../components/Input.js";
import { useOrgtik } from "../provider/OrgtikProvider.js";
const labels = { en: ["Bold message", "Italic message", "Each line as a bullet"], ar: ["رسالة بخط عريض", "رسالة بخط مائل", "كل سطر كنقطة"], de: ["Nachricht fett", "Nachricht kursiv", "Jede Zeile als Aufzählung"], fr: ["Message en gras", "Message en italique", "Chaque ligne en puce"], it: ["Messaggio in grassetto", "Messaggio in corsivo", "Ogni riga come punto"] };
/** Plain text with explicit formatting flags; never interprets user HTML. */
export function RichTextEditor({ label, value, onChange, format, onFormatChange, placeholder, disabled, rows = 3, maxLength = 10000, error, onBlur }) {
    const { locale } = useOrgtik(), words = labels[locale];
    return _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx(Field, { label: label, error: error, children: _jsx(Textarea, { dir: "auto", value: value, disabled: disabled, rows: rows, maxLength: maxLength, onBlur: onBlur, onChange: event => onChange(event.target.value), placeholder: placeholder, className: `${format.bold ? "font-bold" : ""} ${format.italic ? "italic" : ""}` }) }), _jsx("div", { className: "flex flex-wrap gap-1", children: ["bold", "italic", "bullets"].map((key, index) => _jsx(Button, { type: "button", variant: format[key] ? "secondary" : "ghost", size: "sm", disabled: disabled, "aria-pressed": format[key], "aria-label": words[index], onClick: () => onFormatChange({ ...format, [key]: !format[key] }), children: index === 0 ? _jsx(TextB, {}) : index === 1 ? _jsx(TextItalic, {}) : _jsx(ListBullets, {}) }, key)) })] });
}
//# sourceMappingURL=RichTextEditor.js.map