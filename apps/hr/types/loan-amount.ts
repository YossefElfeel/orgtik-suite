import type { ReactNode } from "react";
export type LoanAmountValues = { loanId: string; amount: number };
export type LoanAmountProps = { runId?: number; employeeId?: number; trigger?: ReactNode };
