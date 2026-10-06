export const USD_CURRENCY_CODE = "USD";

export function formatAmount(amount: number | string, currency: string) {
  const value =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/,/g, "")) || 0;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatUsdAmount(amount: number | string) {
  return formatAmount(amount, USD_CURRENCY_CODE);
}
