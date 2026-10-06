// Google Ads targets by name instead of id. The wizard asked people to type geo target ids
// ("e.g. 2756") and language ids ("e.g. 1000") (MKT-058). Google's country targets are 2000 plus
// the ISO 3166 numeric code, and its language targets are fixed ids; the names come from Intl in
// the reader's language.

const COUNTRY_NUMERIC: Record<string, number> = {
  SA: 682, AE: 784, EG: 818, KW: 414, QA: 634, BH: 48, OM: 512, JO: 400, LB: 422, IQ: 368, MA: 504, DZ: 12, TN: 788, LY: 434,
  TR: 792, US: 840, CA: 124, GB: 826, IE: 372, DE: 276, FR: 250, IT: 380, ES: 724, PT: 620, NL: 528, BE: 56, CH: 756, AT: 40,
  SE: 752, NO: 578, DK: 208, FI: 246, PL: 616, GR: 300, RU: 643, IN: 356, PK: 586, CN: 156, JP: 392, AU: 36, NG: 566, ZA: 710,
  KE: 404, BR: 76, MX: 484,
};

const LANGUAGE_IDS: Record<string, string> = {
  ar: "1019", en: "1000", fr: "1002", de: "1001", it: "1004", es: "1003", pt: "1014", nl: "1010", tr: "1037", ru: "1031",
  zh: "1017", ja: "1005", hi: "1023", ur: "1041",
};

const GEO_TO_COUNTRY = Object.fromEntries(Object.entries(COUNTRY_NUMERIC).map(([code, n]) => [String(2000 + n), code]));
const ID_TO_LANGUAGE = Object.fromEntries(Object.entries(LANGUAGE_IDS).map(([code, id]) => [id, code]));

function names(locale: string, type: "region" | "language") {
  try {
    return new Intl.DisplayNames([locale], { type });
  } catch {
    return null;
  }
}

export type TargetOption = { value: string; label: string };

/** Countries Google can target, as {geo target id, country name}. */
export function googleLocationOptions(locale: string): TargetOption[] {
  const dn = names(locale, "region");
  const collator = new Intl.Collator(locale);
  return Object.entries(COUNTRY_NUMERIC)
    .map(([code, n]) => ({ value: String(2000 + n), label: dn?.of(code) || code }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

export function googleLanguageOptions(locale: string): TargetOption[] {
  const dn = names(locale, "language");
  const collator = new Intl.Collator(locale);
  return Object.entries(LANGUAGE_IDS)
    .map(([code, id]) => ({ value: id, label: dn?.of(code) || code }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

/** The name of a stored location id, or null when it isn't a country this list knows. */
export function googleLocationName(id: string, locale: string): string | null {
  const code = GEO_TO_COUNTRY[id];
  return code ? (names(locale, "region")?.of(code) ?? code) : null;
}

export function googleLanguageName(id: string, locale: string): string | null {
  const code = ID_TO_LANGUAGE[id];
  return code ? (names(locale, "language")?.of(code) ?? code) : null;
}
