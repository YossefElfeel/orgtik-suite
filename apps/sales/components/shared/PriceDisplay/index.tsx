"use client";

import { cn } from "@/lib/utils";
import { formatCurrencyAmount, parseAmount } from "@/lib/currency";
import { useGetCurrencyOptionsQuery } from "@/redux/features/currency/currencyApi";
import type { CurrencyOption, PriceDisplayProps } from "@/types/currency";

function resolveCurrencySymbol(code: string): string {
  try {
    const part = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((item) => item.type === "currency");

    return part?.value || code;
  } catch {
    return code;
  }
}

function PriceDisplay({
  price,
  currency,
  className = "",
  showSymbol = true,
  showCode = false,
}: PriceDisplayProps) {
  const { data } = useGetCurrencyOptionsQuery();
  const resolvedCode = (currency || "USD").toUpperCase();

  const fromCatalog = data?.data.find((item) => item.code === resolvedCode);

  const displayCurrency: CurrencyOption = fromCatalog ?? {
    code: resolvedCode,
    name: resolvedCode,
    symbol: resolveCurrencySymbol(resolvedCode),
  };

  const formattedPrice = formatCurrencyAmount(
    parseAmount(price),
    displayCurrency,
  );

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {showSymbol ? <span>{displayCurrency.symbol}</span> : null}
      <span>{formattedPrice}</span>
      {showCode ? (
        <span className="text-xs opacity-70">{displayCurrency.code}</span>
      ) : null}
    </span>
  );
}

export default PriceDisplay;
