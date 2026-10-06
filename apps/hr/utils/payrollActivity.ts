import type { PayrollActivityKey, PayrollActivityMatch } from "@/types/payroll";

// The payroll run's activity log has no action code: the API sends an English sentence
// ("Run frozen", "Submitted 2 employees for approval"). The known sentences are matched here so
// the page can say them in the reader's language; anything else is shown as the API sent it.
const PATTERNS: { key: PayrollActivityKey; re: RegExp; values?: (m: RegExpMatchArray) => PayrollActivityMatch["values"] }[] = [
  { key: "runStarted", re: /^Payroll run started$/ },
  { key: "runFrozen", re: /^Run frozen$/ },
  { key: "runReopenedWithdrawn", re: /^Run re-opened \((\d+) submissions? withdrawn\)$/, values: (m) => ({ count: Number(m[1]) }) },
  { key: "runReopened", re: /^Run re-opened$/ },
  { key: "submitted", re: /^Submitted (\d+) employees? for approval$/, values: (m) => ({ count: Number(m[1]) }) },
  { key: "approvedAll", re: /^Approved all rows$/ },
  { key: "approvedRows", re: /^Approved (\d+) rows?$/, values: (m) => ({ count: Number(m[1]) }) },
  { key: "changeRequested", re: /^Change requested for (.+)$/, values: (m) => ({ name: m[1] }) },
  { key: "resubmitted", re: /^Resubmitted (.+)$/, values: (m) => ({ name: m[1] }) },
  { key: "bonusAdded", re: /^Bonus added for (.+)$/, values: (m) => ({ name: m[1] }) },
  { key: "deductionAdded", re: /^Deduction added for (.+)$/, values: (m) => ({ name: m[1] }) },
  { key: "queuedAll", re: /^Queued for payout$/ },
  { key: "queued", re: /^Queued (\d+) payments? for payout$/, values: (m) => ({ count: Number(m[1]) }) },
  { key: "markedPaidAll", re: /^Marked as paid$/ },
  { key: "markedPaid", re: /^Marked (\d+) payments? as paid$/, values: (m) => ({ count: Number(m[1]) }) },
  { key: "paidEmployee", re: /^Paid (.+)$/, values: (m) => ({ name: m[1] }) },
  { key: "bankFileExported", re: /^Bank file exported$/ },
  { key: "payslipsSent", re: /^Sent (\d+) payslips? by email$/, values: (m) => ({ count: Number(m[1]) }) },
  { key: "imported", re: /^Imported (\d+) adjustments? from (.+)$/, values: (m) => ({ count: Number(m[1]), name: m[2] }) },
];

/** The catalog key (and its values) for a known payroll activity sentence, or null. */
export function matchPayrollActivity(action: string | null | undefined): PayrollActivityMatch | null {
  const text = (action ?? "").trim();
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (m) return { key: p.key, values: p.values ? p.values(m) : {} };
  }
  return null;
}
