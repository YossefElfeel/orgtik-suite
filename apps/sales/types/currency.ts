import type { IPaginated } from "@/types";

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  nativeName: string;
  symbol: string;
  symbolNative: string;
  minorUnits: number;
  countryCodes: string[];
  usdRate: string | null;
  rateUpdatedAt: string | null;
  isSelectable: boolean;
}

export interface SupportedCurrenciesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  selectable?: boolean;
}

export interface CurrencyConversionResult {
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  baseCurrency: string;
  ratesAsOf: string;
}

export interface CurrencyConvertQueryParams {
  amount: string;
  from: string;
  to: string;
}

export interface ExchangeRate {
  currencyCode: string;
  usdRate: string;
  updatedAt: string;
  isStale: boolean;
}

export interface ExchangeRatesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ExchangeRatesResponse extends IPaginated<ExchangeRate> {
  baseCurrency: string;
}

export type SupportedCurrenciesResponse = IPaginated<SupportedCurrency>;

export interface CurrencyRefreshResult {
  jobId: string;
  status: "queued" | "already_queued";
}

export type PriceDisplayProps = {
  price: number | string;
  /** ISO 4217 code from the API payload — required for business amounts. */
  currency: string;
  className?: string;
  showSymbol?: boolean;
  showCode?: boolean;
};
