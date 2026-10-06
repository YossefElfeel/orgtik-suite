"use client";

import PriceDisplay from "@/components/shared/PriceDisplay";

type CurrencyAmountProps = {
  amount: number | string;
  /** ISO currency from the API — pass this so the symbol matches the native amount. */
  currency?: string;
  className?: string;
  showSymbol?: boolean;
  showCode?: boolean;
};

export default function CurrencyAmount({
  amount,
  currency,
  className,
  showSymbol = true,
  showCode = false,
}: CurrencyAmountProps) {
  return (
    <PriceDisplay
      price={amount}
      currency={currency || "USD"}
      className={className}
      showSymbol={showSymbol}
      showCode={showCode}
    />
  );
}
