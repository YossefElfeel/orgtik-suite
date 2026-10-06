import type { PaginationOptions } from ".";
import type { UseFormReturn } from "react-hook-form";
import type { ZoneFormValues } from "@/schemas/zones";

export type ZoneCountry = {
  code: string;
  name: string;
  nativeName?: string;
};

export type ZoneCurrency = {
  code: string;
  name: string;
  symbol?: string;
};

export type ZoneLanguageOption = {
  code: string;
  label: string;
  nativeLabel?: string;
};

export type ZoneLanguage = {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  isDefault?: boolean;
};

export type Zone = {
  id: string;
  name: string;
  defaultCurrency: ZoneCurrency;
  countries: ZoneCountry[];
  languages: ZoneLanguage[];
  defaultLanguageCode: string;
  createdAt: string;
  updatedAt: string;
};

export type ZoneListItem = {
  id: string;
  name: string;
};

export type ZoneCatalogCountry = {
  code: string;
  name: string;
  nativeName: string;
  currencyCodes: string[];
  languageCodes: string[];
};

export type ZoneCatalogLanguage = {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
};

export type ZoneDTO = {
  name: string;
  defaultCurrencyCode: string;
  countryCodes: string[];
  languageCodes: string[];
  defaultLanguageCode: string;
};

export type ZonesQueryParams = PaginationOptions;

export type ZoneCountryFieldProps = {
  form: UseFormReturn<ZoneFormValues>;
  enabled: boolean;
  initialCountries?: ZoneCountry[];
  onCountriesLoaded: (countries: ZoneCatalogCountry[]) => void;
};

export type ZoneCurrencyFieldProps = {
  form: UseFormReturn<ZoneFormValues>;
  countries: ZoneCatalogCountry[];
};

export type ZoneLanguageFieldsProps = {
  form: UseFormReturn<ZoneFormValues>;
  enabled: boolean;
};

/** @deprecated Prefer `Zone` from the zones API. Kept for mock/package UIs. */
export type PlanZoneItem = {
  id: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  countries: ZoneCountry[];
  languages: string[];
  defaultLanguage: string;
};
