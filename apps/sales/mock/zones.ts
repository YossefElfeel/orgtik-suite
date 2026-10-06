import type {
  PlanZoneItem,
  ZoneCountry,
  ZoneCurrency,
  ZoneLanguageOption,
} from "@/types/zones";

export const zoneCurrencyOptions: ZoneCurrency[] = [
  { code: "USD", name: "United States Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "AED", name: "UAE Dirham" },
  { code: "GBP", name: "Pound Sterling" },
  { code: "EGP", name: "Egyptian Pound" },
];

export const zoneCountryOptions: ZoneCountry[] = [
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "KW", name: "Kuwait" },
  { code: "QA", name: "Qatar" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "EG", name: "Egypt" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
];

export const zoneLanguageOptions: ZoneLanguageOption[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
];

export const zonesData: PlanZoneItem[] = [
  {
    id: "middle-east",
    name: "Middle East",
    currencyCode: "SAR",
    currencyName: "Saudi Riyal",
    countries: [
      { code: "SA", name: "Saudi Arabia" },
      { code: "AE", name: "United Arab Emirates" },
      { code: "KW", name: "Kuwait" },
      { code: "QA", name: "Qatar" },
      { code: "BH", name: "Bahrain" },
      { code: "OM", name: "Oman" },
    ],
    languages: ["ar", "en"],
    defaultLanguage: "ar",
  },
  {
    id: "europe",
    name: "Europe",
    currencyCode: "EUR",
    currencyName: "Euro",
    countries: [
      { code: "DE", name: "Germany" },
      { code: "FR", name: "France" },
      { code: "IT", name: "Italy" },
      { code: "ES", name: "Spain" },
      { code: "NL", name: "Netherlands" },
      { code: "BE", name: "Belgium" },
      { code: "AT", name: "Austria" },
      { code: "SE", name: "Sweden" },
    ],
    languages: ["en", "de", "fr", "es", "it", "nl"],
    defaultLanguage: "en",
  },
  {
    id: "americas",
    name: "Americas",
    currencyCode: "USD",
    currencyName: "United States Dollar",
    countries: [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
      { code: "MX", name: "Mexico" },
      { code: "BR", name: "Brazil" },
      { code: "AR", name: "Argentina" },
      { code: "CL", name: "Chile" },
    ],
    languages: ["en", "es", "pt"],
    defaultLanguage: "en",
  },
  {
    id: "apac",
    name: "APAC",
    currencyCode: "USD",
    currencyName: "United States Dollar",
    countries: [
      { code: "JP", name: "Japan" },
      { code: "KR", name: "South Korea" },
      { code: "SG", name: "Singapore" },
      { code: "AU", name: "Australia" },
      { code: "NZ", name: "New Zealand" },
      { code: "IN", name: "India" },
      { code: "PH", name: "Philippines" },
    ],
    languages: ["en", "ja", "ko", "zh", "hi"],
    defaultLanguage: "en",
  },
];

export function getZoneById(id: string) {
  return zonesData.find((zone) => zone.id === id);
}

export function getZoneCurrencyOptions() {
  return zoneCurrencyOptions.map((currency) => ({
    value: currency.code,
    label: `${currency.code} ${currency.name}`,
  }));
}

export function getZoneCountryOptions() {
  return zoneCountryOptions.map((country) => ({
    value: country.code,
    label: country.name,
    searchText: `${country.code} ${country.name}`,
  }));
}

export function getZoneLanguageOptions() {
  return zoneLanguageOptions.map((language) => ({
    value: language.code,
    label: language.label,
  }));
}

export function formatLanguageCodes(codes: string[]) {
  return codes
    .map((code) => code.toUpperCase())
    .join(", ");
}

export function formatCountryCodes(countries: ZoneCountry[]) {
  return countries.map((country) => country.code).join(", ");
}

export function formatCurrencyLabel(code: string, name: string) {
  return `${code} ${name}`;
}
