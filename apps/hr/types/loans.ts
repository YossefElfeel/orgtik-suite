export interface IEmployee {
  id: number;
  employeeCode: string;
  name: string;
  departmentName: string;
  jobTitle: string | null;
}

export type IStatusLoans = "active" | "paused" | "closed" | "cancelled";

export interface ILoan {
  id: number;
  employeeId: number;
  employee: IEmployee;
  title: string;
  principalAmount: number;
  installmentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  startDate: string;
  status: IStatusLoans;
  reason: string;
}

export interface ILoanInstallment {
  id: number;
  runId: number;
  runItemId: number;
  frequency: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  runStatus: string;
  itemStatus: string;
  suggestedAmount: number;
  appliedAmount: number;
  remainingBeforeAmount: number;
  projectedRemainingAfterAmount: number;
  isOverride: boolean;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
}

export interface ILoanDetail extends ILoan {
  installmentCount: number;
  paidInstallmentCount: number;
  pendingInstallmentCount: number;
  installments: ILoanInstallment[];
}

export interface UpdateLoanDto {
  title?: string;
  installmentAmount?: number;
  remainingAmount?: number;
  reason?: string;
  status?: IStatusLoans;
}

export interface UpdateLoanStatusDto {
  status: IStatusLoans;
}

export interface LoansResponse {
  items: ILoan[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
