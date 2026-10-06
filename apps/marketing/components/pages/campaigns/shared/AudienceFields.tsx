"use client";

// Who a paid social campaign (or one of its ad sets) reaches: countries, ages, gender, interests.
// Countries are picked by name in the reader's language; the API keeps their English names.
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Field, MultiSelect, NumberField, RadioGroup } from "@orgtik/ui";
import { ISO_COUNTRY_CODES, englishCountryName } from "@/constants/countries";
import { PAID_SOCIAL_GENDER_VALUES, PAID_SOCIAL_INTEREST_SUGGESTIONS } from "@/constants/campaigns";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { toInterestToken, type Audience, type Gender } from "@/lib/campaigns/paid-social";
import { ChoiceChips } from "./Choice";
import { TagInput } from "./TagInput";

export type AudienceErrors = { locations?: string; age?: string };

export function AudienceFields({ value, onChange, errors, idPrefix }: { value: Audience; onChange: (a: Audience) => void; errors?: AudienceErrors; idPrefix: string }) {
  const t = useTranslations("CampaignPaid");
  const tw = useTranslations("CampaignWizard");
  const locale = useLocale();
  const labels = useCampaignLabels();
  const patch = (p: Partial<Audience>) => onChange({ ...value, ...p });

  const countries = useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      dn = null;
    }
    const collator = new Intl.Collator(locale);
    const list = ISO_COUNTRY_CODES.map((code) => ({ value: englishCountryName(code), label: dn?.of(code) || code })).sort((a, b) => collator.compare(a.label, b.label));
    const known = new Set(list.map((o) => o.value));
    return [...list, ...value.locations.filter((l) => !known.has(l)).map((l) => ({ value: l, label: l }))];
  }, [locale, value.locations]);

  const suggestions = PAID_SOCIAL_INTEREST_SUGGESTIONS.filter((s) => !value.interests.includes(s));

  return (
    <div className="flex flex-col gap-4">
      <Field label={t("locations")} required error={errors?.locations}>
        <MultiSelect value={value.locations} onValueChange={(l) => patch({ locations: l })} options={countries} placeholder={t("locationsPlaceholder")} emptyText={tw("noMatch")} />
      </Field>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-label text-fg">{t("age")}</legend>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <Field label={t("ageMin")}>
            <NumberField value={value.ageMin} min={13} max={65} onValueChange={(n) => patch({ ageMin: n ?? 13 })} />
          </Field>
          <Field label={t("ageMax")}>
            <NumberField value={value.ageMax} min={13} max={65} onValueChange={(n) => patch({ ageMax: n ?? 65 })} />
          </Field>
        </div>
        {errors?.age ? <p className="text-caption text-danger">{errors.age}</p> : null}
      </fieldset>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-label text-fg">{t("gender")}</legend>
        <RadioGroup<Gender>
          name={`${idPrefix}-gender`}
          aria-label={t("gender")}
          orientation="horizontal"
          value={value.gender}
          onValueChange={(g) => patch({ gender: g })}
          options={PAID_SOCIAL_GENDER_VALUES.map((g) => ({ value: g, label: labels.label("gender", g) }))}
        />
      </fieldset>
      <TagInput
        label={t("interests")}
        values={value.interests}
        onChange={(i) => patch({ interests: i })}
        normalize={toInterestToken}
        display={(i) => labels.label("interest", i)}
        placeholder={t("interestsPlaceholder")}
        maxLength={60}
      />
      {suggestions.length ? (
        <ChoiceChips<string>
          multiple
          legend={t("interestSuggestions")}
          name={`${idPrefix}-interest-suggestions`}
          value={[]}
          onChange={(picked) => patch({ interests: [...value.interests, ...picked] })}
          options={suggestions.map((s) => ({ value: s, label: labels.label("interest", s) }))}
        />
      ) : null}
    </div>
  );
}

export function audienceErrors(a: Audience, t: (key: string) => string): AudienceErrors {
  const e: AudienceErrors = {};
  if (!a.locations.length) e.locations = t("locationsRequired");
  if (a.ageMax < a.ageMin) e.age = t("ageOrder");
  return e;
}
