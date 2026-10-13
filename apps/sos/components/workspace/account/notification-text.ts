/** System events are translated; authored titles remain workspace content. */
export function notificationTitle(row: { kind?: string; title: string }, t: (key: string) => string): string {
  const keys: Record<string, string> = { trial_ending: "trialNotice", payment_failed: "paymentNotice", price_change: "priceNotice", service_update: "serviceNotice" };
  const titles: Record<string, string> = { "You were mentioned": "mentionNotice", "New reply": "replyNotice", "New contract awaiting review": "contractNotice", "New support ticket": "ticketNotice", "New offer request": "offerNotice" };
  const key = row.kind && keys[row.kind] || titles[row.title];
  return key ? t(key) : row.title;
}
