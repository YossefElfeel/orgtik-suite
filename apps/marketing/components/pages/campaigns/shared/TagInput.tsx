"use client";

// A list of short texts typed one at a time: headlines, interests, a category. Enter or the Add
// button adds the text; each one is a Tag with a named remove button.
import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { IconButton, Input, Tag, cn } from "@orgtik/ui";

type Props = {
  label: ReactNode;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** How a stored value is shown (e.g. humanize an interest token). */
  display?: (value: string) => string;
  /** Turns typed text into the stored value (e.g. an interest token). */
  normalize?: (value: string) => string;
  maxLength?: number;
  max?: number;
  className?: string;
};

export function TagInput({ label, values, onChange, placeholder, description, error, required, display = (v) => v, normalize = (v) => v, maxLength, max, className }: Props) {
  const t = useTranslations("CampaignWizard");
  const id = useId();
  const [draft, setDraft] = useState("");
  const full = max != null && values.length >= max;
  const add = () => {
    const text = draft.trim();
    if (!text || full) return;
    const value = normalize(text);
    if (!values.includes(value)) onChange([...values, value]);
    setDraft("");
  };
  const describedBy = [description ? `${id}-d` : null, error ? `${id}-e` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label text-fg">
        {label}
        {required ? (
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="flex items-start gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={maxLength}
          disabled={full}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          dir="auto"
          className="min-w-0 flex-1"
        />
        <IconButton type="button" variant="secondary" label={t("addItem")} icon={<Plus />} onClick={add} disabled={!draft.trim() || full} />
      </div>
      {description ? (
        <p id={`${id}-d`} className="text-caption text-fg-muted">
          {description}
        </p>
      ) : null}
      {values.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={typeof label === "string" ? label : undefined}>
          {values.map((v) => (
            <li key={v} className="max-w-full">
              <Tag onRemove={() => onChange(values.filter((x) => x !== v))}>{display(v)}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p id={`${id}-e`} className="text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
