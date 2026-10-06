type InvoiceCurrencyLike = {
  currencyCode?: string | null;
  /** @deprecated Prefer `currencyCode`. */
  currency?: string | null;
};

/**
 * Resolve an invoice's denomination.
 * Prefer `currencyCode`; fall back to deprecated `currency` for older payloads only.
 * Checkout / bulk-pay must use this value as fixed — never send a conflicting `paymentCurrency`.
 */
export function getInvoiceCurrencyCode(
  invoice: InvoiceCurrencyLike | null | undefined,
  fallback = "USD",
): string {
  const code = invoice?.currencyCode?.trim() || invoice?.currency?.trim();
  return code || fallback;
}

/** Group invoices by denomination for bulk-pay (one checkout per currencyCode). */
export function groupInvoicesByCurrencyCode<T extends InvoiceCurrencyLike>(
  invoices: T[],
  fallback = "USD",
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const invoice of invoices) {
    const code = getInvoiceCurrencyCode(invoice, fallback);
    const bucket = groups.get(code);
    if (bucket) {
      bucket.push(invoice);
    } else {
      groups.set(code, [invoice]);
    }
  }

  return groups;
}
