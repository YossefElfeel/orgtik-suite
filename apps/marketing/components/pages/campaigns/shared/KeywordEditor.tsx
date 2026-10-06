"use client";

// Keywords with a match type: text, Phrase/Broad/Exact, and the list. Each keyword shows its match
// type in words, and its remove button names it.
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "@phosphor-icons/react";
import { IconButton, Input, Select, cn } from "@orgtik/ui";
import { KEYWORD_MATCH_TYPE_VALUES } from "@/constants/campaigns";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import type { CampaignKeyword, MatchType } from "@/lib/campaigns/types";

type Props = {
  label: string;
  keywords: CampaignKeyword[];
  onChange: (keywords: CampaignKeyword[]) => void;
  placeholder?: string;
  negative?: boolean;
  required?: boolean;
  error?: string;
};

export function KeywordEditor({ label, keywords, onChange, placeholder, negative, required, error }: Props) {
  const t = useTranslations("CampaignGoogle");
  const labels = useCampaignLabels();
  const id = useId();
  const [text, setText] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("PHRASE");
  const add = () => {
    const value = text.trim();
    if (!value) return;
    if (!keywords.some((k) => k.text.toLowerCase() === value.toLowerCase() && k.matchType === matchType)) onChange([...keywords, { text: value, matchType }]);
    setText("");
  };
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-fg">
        {label}
        {required ? (
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="flex flex-wrap items-start gap-2">
        <Input
          id={id}
          value={text}
          dir="auto"
          maxLength={80}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : undefined}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="min-w-40 flex-1"
        />
        <Select<MatchType>
          aria-label={t("matchType")}
          value={matchType}
          onValueChange={(m) => m && setMatchType(m)}
          options={KEYWORD_MATCH_TYPE_VALUES.map((m) => ({ value: m, label: labels.label("matchType", m) }))}
          className="w-36"
        />
        <IconButton type="button" variant="secondary" label={negative ? t("addNegativeKeyword") : t("addKeyword")} icon={<Plus />} onClick={add} disabled={!text.trim()} />
      </div>
      {keywords.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {keywords.map((k, i) => (
            <li
              key={`${k.text}-${k.matchType}-${i}`}
              className={cn("inline-flex h-7 max-w-full items-center gap-1.5 rounded-pill border ps-2.5 pe-1 text-body-sm", negative ? "border-danger bg-danger-subtle text-danger" : "border-line bg-brand-subtle text-fg-brand")}
            >
              <bdi className="truncate font-semibold">{k.text}</bdi>
              <span className="text-caption">{labels.label("matchType", k.matchType)}</span>
              <button
                type="button"
                onClick={() => onChange(keywords.filter((_, j) => j !== i))}
                aria-label={t("removeKeyword", { keyword: k.text })}
                className="grid size-5 place-items-center rounded-pill hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
              >
                <X aria-hidden className="size-3" />
              </button>
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
