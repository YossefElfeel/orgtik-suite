"use client";

// Choice cards and chips with real radio and checkbox semantics. The type cards, category chips,
// network chips, publish-mode and audience-source cards were plain buttons whose state showed only
// as a border colour, so a screen reader heard nothing and the audit logged them as dead ends
// (MKT-044). Each option is a native input inside its label; the chosen one has a check and says
// "Selected" in words.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@orgtik/ui";

export type ChoiceOption<V extends string> = {
  value: V;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

type CardsProps<V extends string> = {
  /** The group's name, shown as its legend (or only to screen readers with hideLegend). */
  legend: ReactNode;
  hideLegend?: boolean;
  name: string;
  options: ChoiceOption<V>[];
  value: V | null | undefined;
  onChange: (value: V) => void;
  columns?: 1 | 2 | 3;
  error?: ReactNode;
  className?: string;
};

/** One choice from a few, as cards with an icon, a title and a line of description. */
export function ChoiceCards<V extends string>({ legend, hideLegend, name, options, value, onChange, columns = 2, error, className }: CardsProps<V>) {
  const t = useTranslations("CampaignWizard");
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2", className)} aria-invalid={error ? true : undefined}>
      <legend className={cn("mb-2 text-label text-fg", hideLegend && "sr-only")}>{legend}</legend>
      <div className={cn("grid gap-3", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative flex min-w-0 cursor-pointer items-start gap-3 rounded-card border bg-raised p-3 text-start transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                checked ? "border-action-primary bg-brand-subtle" : "border-line hover:bg-hover",
                o.disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input type="radio" name={name} value={o.value} checked={checked} disabled={o.disabled} onChange={() => onChange(o.value)} className="sr-only" />
              {o.icon ? (
                <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-field", checked ? "bg-action-primary text-on-action-primary" : "bg-sunken text-fg-muted")}>
                  {o.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body font-semibold text-fg">{o.title}</span>
                {o.description ? <span className="text-body-sm text-fg-muted">{o.description}</span> : null}
              </span>
              {checked ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-caption font-semibold text-fg-brand">
                  <CheckCircle weight="fill" aria-hidden className="size-4" />
                  {t("selected")}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error ? <p className="text-caption text-danger">{error}</p> : null}
    </fieldset>
  );
}

type ChipsProps<V extends string> = {
  legend: ReactNode;
  hideLegend?: boolean;
  name: string;
  options: { value: V; label: ReactNode; disabled?: boolean }[];
  error?: ReactNode;
  className?: string;
} & (
  | { multiple?: false; value: V | null | undefined; onChange: (value: V | null) => void; allowClear?: boolean }
  | { multiple: true; value: V[]; onChange: (value: V[]) => void; allowClear?: never }
);

/** Compact options in a row: one choice (radio) or several (checkbox). The chosen ones show a check. */
export function ChoiceChips<V extends string>(props: ChipsProps<V>) {
  const { legend, hideLegend, name, options, error, className } = props;
  const isOn = (v: V) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: V) => {
    if (props.multiple) props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onChange(props.allowClear && props.value === v ? null : v);
  };
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2", className)}>
      <legend className={cn("mb-2 text-label text-fg", hideLegend && "sr-only")}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = isOn(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border px-3 text-body-sm transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                on ? "border-action-primary bg-brand-subtle font-semibold text-fg-brand" : "border-line bg-raised text-fg hover:bg-hover",
                o.disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type={props.multiple ? "checkbox" : "radio"}
                name={name}
                value={o.value}
                checked={on}
                disabled={o.disabled}
                onChange={() => toggle(o.value)}
                onClick={(e) => {
                  // A radio can't be unticked by the browser; a chip that clears on a second press can.
                  if (!props.multiple && props.allowClear && on) {
                    e.preventDefault();
                    toggle(o.value);
                  }
                }}
                className="sr-only"
              />
              {on ? <Check weight="bold" aria-hidden className="size-3.5" /> : null}
              {o.label}
            </label>
          );
        })}
      </div>
      {error ? <p className="text-caption text-danger">{error}</p> : null}
    </fieldset>
  );
}
