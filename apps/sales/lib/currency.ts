import type { CurrencyOption, ExchangeRate, SupportedCurrency } from "@/types/currency";

export const BASE_CURRENCY = "USD";

export type CurrencyConversionSource = SupportedCurrency | ExchangeRate;

function getCurrencyCode(item: CurrencyConversionSource): string {
  return "currencyCode" in item ? item.currencyCode : item.code;
}

function getUsdRateValue(item: CurrencyConversionSource): string | null {
  return item.usdRate ?? null;
}

export function parseAmount(value: number | string): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

export function getUsdRate(
  currencyCode: string,
  currencies: CurrencyConversionSource[],
): number | null {
  if (currencyCode === BASE_CURRENCY) {
    return 1;
  }

  const currency = currencies.find(
    (item) => getCurrencyCode(item) === currencyCode,
  );

  const usdRate = currency ? getUsdRateValue(currency) : null;

  if (!usdRate) {
    return null;
  }

  const rate = Number(usdRate);

  return Number.isFinite(rate) ? rate : null;
}

export function convertCurrencyAmount(
  amount: number | string,
  fromCurrency: string,
  toCurrency: string,
  currencies: CurrencyConversionSource[],
): number | null {
  const numericAmount = parseAmount(amount);

  if (fromCurrency === toCurrency) {
    return numericAmount;
  }

  const fromRate = getUsdRate(fromCurrency, currencies);
  const toRate = getUsdRate(toCurrency, currencies);

  if (fromRate === null || toRate === null) {
    return null;
  }

  const usdAmount =
    fromCurrency === BASE_CURRENCY ? numericAmount : numericAmount / fromRate;

  return toCurrency === BASE_CURRENCY ? usdAmount : usdAmount * toRate;
}

export function formatCurrencyAmount(
  amount: number,
  currency: (CurrencyOption & { minorUnits?: number }) | null,
): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency?.minorUnits ?? 2,
    maximumFractionDigits: currency?.minorUnits ?? 2,
  }).format(amount);
}

export function mapCurrencyOptionsToComboboxOptions(
  currencies: CurrencyOption[],
) {
  return currencies.map((currency) => ({
    value: currency.code,
    label: currency.symbol
      ? `${currency.code} (${currency.symbol})`
      : currency.code,
    searchText: `${currency.code} ${currency.name} ${currency.symbol}`,
  }));
}
