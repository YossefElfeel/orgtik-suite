export type AdjustmentType = "bonus" | "deduction";
export type InputMode = "fixed" | "percent" | "days" | "months";

export interface PayrollAdjustment {
  type: AdjustmentType;
  inputMode: InputMode;
  description: string;
  amount: number;
  dayUnits: number;
  notes: string;
}

export interface PayrollUpdateDto {
  adjustments: PayrollAdjustment[];
}

///////////////////////////////////////////////////////////
export type PayrollFrequency = "monthly" | "weekly" | "biweekly" | "hourly";

export type PayrollStatus =
  | "open"
  | "frozen"
  | "submitted"
  | "partially_approved"
  | "approved"
  | "payout_queued"
  | "partially_paid"
  | "paid"
  | "cancelled";

export type SortOrder = "ASC" | "DESC";

export interface GetPayrollRunsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: SortOrder;
  frequency?: PayrollFrequency;
  status?: PayrollStatus;
  periodStart?: string;
  periodEnd?: string;
}

export interface PayrollRunSummary {
  id: number;
  frequency: PayrollFrequency;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  status: "open" | "closed" | "processing" | "draft"; // mapped with API status
  itemCount: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  changeRequestedCount: number;
  queuedCount: number;
  paidCount: number;
  baseSalaryTotal: number;
  bonusTotal: number;
  deductionTotal: number;
  loanTotal: number;
  netPayableTotal: number;
  /** "September 2026", "Week 40 · …": the API's name for the period. */
  title?: string;
  /** The currency the run's totals are in (ISO 4217, e.g. "EGP"). */
  displayCurrency?: string;
  /** The approved rows' net pay: what "Send to finance" moves. */
  pendingAmount?: number;
}

/** The run's actions in the payroll header (FS-HR-7). */
export interface RunActionsProps {
  run: PayrollRunSummary;
  /** "open" allows edits; anything else is frozen or later. */
  status: string;
  canEmailPayslips: boolean;
}

/** The payroll page when a period has no run (FS-HR-7). */
export interface EmptyPayrollStateProps {
  /** The period in the reader's language: "September 2026", "Week 40 · 28 Sep – 4 Oct". */
  period: string;
  type: "monthly" | "bi-weekly" | "weekly" | "hourly";
  onStart: () => Promise<unknown>;
  onSwitchToMonthly: () => void;
}

export interface PayrollEmployee {
  id: number;
  employeeCode: string;
  name: string;
  departmentName: string;
  jobTitle: string;
}

// Item shape when tab="all"
export interface PayrollItemAll {
  id: number;
  runId: number;
  employee: PayrollEmployee;
  currency: string;
  paymentMethod: string;
  paymentCycle: string;
  baseSalary: number;
  periodBaseSalary: number;
  bonusTotal: number;
  deductionTotal: number;
  loanTotal: number;
  netPayable: number;
  status:
    | "draft"
    | "submitted"
    | "approved"
    | "change_requested"
    | "queued"
    | "paid"
    | "cancelled";
  changeRequestNote: string | null;
}

// Item shape when tab="bonus" or tab="deduction"
export interface PayrollItemAdjustment {
  id: number;
  employee: PayrollEmployee;
  amount: number;
  mode: "fixed" | "percent" | "days" | "months";
  reason: string;
  date: string;
}

// Item shape when tab="loans"
export interface PayrollItemLoan {
  id: number;
  employee: PayrollEmployee;
  loanTitle: string;
  totalLoan: number;
  paid: number;
  remaining: number;
  monthly: number;
  reason: string;
  date: string;
}

export interface PayrollPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GetPayrollRunItemsResponse<T> {
  run: PayrollRunSummary;
  items: T[];
  meta: PayrollPaginationMeta;
}

export interface GetPayrollRunItemsParams {
  id: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  status?:
    | "draft"
    | "submitted"
    | "approved"
    | "change_requested"
    | "queued"
    | "paid"
    | "cancelled";
  tab?: "all" | "bonus" | "deduction" | "loans";
  search?: string;
}

export interface StartPayrollRunDto {
  frequency: PayrollFrequency;
  referenceDate: string;
  month: number;
  year: number;
  note?: string;
}

export interface CreatePayrollLoanDto {
  employeeId: number;
  title: string;
  principalAmount: number;
  durationMonths: number;
  installmentAmount: number;
  currency: string;
  startDate: string;
  reason?: string;
}

export interface SubmitPayrollEmployeesDto {
  employeeIds: number[];
  note?: string;
}

export interface GetPayrollPayoutsResponse {
  data: any[]; // Adjust as needed
  meta: PayrollPaginationMeta;
}

export interface ExportBankFileResponse {
  filename: string;
  contentType: string;
  content: string;
}
/////////////////////////////////////////
export interface IPayrollRunsResponse {
  success: boolean;
  message: string;
  data: {
    items: {
      id: number;
      frequency: string;
      periodStart: string;
      periodEnd: string;
      referenceDate: string;
      status: "open" | "submitted" | "approved" | "paid";

      itemCount: number;
      draftCount: number;
      submittedCount: number;
      approvedCount: number;
      changeRequestedCount: number;
      queuedCount: number;
      paidCount: number;

      baseSalaryTotal: number;
      bonusTotal: number;
      deductionTotal: number;
      loanTotal: number;
      netPayableTotal: number;

      title: string;

      pendingReviewCount: number;
      pendingPayoutTotal: number;
      decidedCount: number;
      flaggedCount: number;

      currencies: string[];
      displayCurrency: string | null;

      note: string;

      frozenAt: string | null;
      submittedAt: string | null;
      approvedAt: string | null;
      paidAt: string | null;
    }[];

    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };

    stats: {
      totalRuns: number;
      pendingReviewRuns: number;
      changedRuns: number;
      payoutReadyRuns: number;

      totalEmployees: number;
      pendingReviewEmployees: number;
      approvedEmployees: number;
      flaggedEmployees: number;

      netPayableTotal: number;
    };
  };
}

export interface IPayrollRunByIdAdminResponse {
  success: boolean;
  message: string;
  data: {
    run: {
      id: number;
      frequency: "monthly" | "weekly" | "biweekly";
      periodStart: string;
      periodEnd: string;
      referenceDate: string;
      status: "open" | "submitted" | "approved" | "paid";
      itemCount: number;
      draftCount: number;
      submittedCount: number;
      approvedCount: number;
      changeRequestedCount: number;
      queuedCount: number;
      paidCount: number;
      baseSalaryTotal: number;
      bonusTotal: number;
      deductionTotal: number;
      loanTotal: number;
      netPayableTotal: number;
      title: string;
      pendingReviewCount: number;
      pendingPayoutTotal: number;
      decidedCount: number;
      flaggedCount: number;
      currencies: string[];
      displayCurrency: string | null;
      note: string | null;
      frozenAt: string | null;
      submittedAt: string | null;
      approvedAt: string | null;
      paidAt: string | null;
    };

    items: {
      id: number;
      runId: number;

      employee: {
        id: number;
        employeeCode: string;
        name: string;
        departmentName: string;
        jobTitle: string;
      };

      paymentMethod: string;
      paymentCycle: string;
      currency: string | null;

      baseSalary: number;
      periodBaseSalary: number;
      bonusTotal: number;
      deductionTotal: number;
      loanTotal: number;
      netPayable: number;

      status: "draft" | "submitted" | "approved" | "rejected";

      changeRequestNote: string | null;

      grossSalarySnapshot: number;
      netSalarySnapshot: number;

      dailyRate: number;
      hourlyRate: number;

      workingDaysCount: number;
      workedDaysCount: number;
      workedHours: number;

      adjustments: {
        id: number;
        type: "bonus" | "deduction";
        mode: "fixed" | "percentage";
        value: number;
        amount: number;
        reason: string;
      }[];

      loanApplications: any[];
    }[];

    activityLogs: {
      id: number;
      action: string;
      entityType: string;
      entityId: string;

      performedBy: number;

      performedByUser: {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string;
        isActive: boolean;
        userType: string | null;
      };

      metadata: Record<string, any> | null;

      createdAt: string;
    }[];

    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export type TReviewAction = "approved" | "change_requested";

export interface ISubmitPayrollReviewItem {
  runItemId: number;
  action: TReviewAction;
  note?: string;
}

export interface ISubmitPayrollReviewRequest {
  items: ISubmitPayrollReviewItem[];
}

export interface IPayrollRunItem {
  id: number;

  frequency: "monthly" | "weekly" | "biweekly";

  periodStart: string;
  periodEnd: string;
  referenceDate: string;

  status: "open" | "submitted" | "approved" | "paid";

  itemCount: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  changeRequestedCount: number;
  queuedCount: number;
  paidCount: number;

  baseSalaryTotal: number;
  bonusTotal: number;
  deductionTotal: number;
  loanTotal: number;
  netPayableTotal: number;

  title: string;

  pendingCount: number;
  pendingAmount: number;
  queuedAmount: number;
  paidAmount: number;
  payableAmount: number;
  totalAmount: number;

  currencies: string[];
  displayCurrency: string | null;

  canQueueAll: boolean;
  canPayAll: boolean;
  isClosed: boolean;
}

export interface MyPayslipCurrency {
  code?: string;
  symbol?: string;
  name?: string;
}

export interface MyPayslipItem {
  id: number;
  runId: number;
  periodTitle: string;
  periodStart: string;
  periodEnd: string;
  netPayable: number;
  currency?: MyPayslipCurrency | string;
  paidAt?: string | null;
  payslipGeneratedAt?: string | null;
  hasPayslip: boolean;
}

export interface GetMyPayslipsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: SortOrder;
}

export interface GetEmployeePayslipsParams extends GetMyPayslipsParams {
  id: string | number;
}

export interface EmployeePayslipFileParams {
  employeeId: string | number;
  payslipId: number;
}

export interface PayrollFinanceImportBatch {
  id: number;
  runId: number;
  filename: string;
  format: string;
  rowCount: number;
  createdCount: number;
  errorCount: number;
  importedByUserId: string;
  createdAt: string;
}

export interface PayrollFinanceImportSheetParams {
  file: File;
}

export interface PayrollFinanceSheetsExportParams {
  runId: number;
  format?: "xlsx" | "csv";
}

/** A payroll batch waiting for the admin (GET /payroll/admin/runs). */
export interface IPendingBatch {
  id: number | string;
  frequency: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  status: string;
  itemCount: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  changeRequestedCount: number;
  queuedCount: number;
  paidCount: number;
  baseSalaryTotal: number;
  bonusTotal: number;
  deductionTotal: number;
  loanTotal: number;
  netPayableTotal: number;
  title: string;
  pendingReviewCount: number;
  pendingPayoutTotal: number;
  decidedCount: number;
  flaggedCount: number;
  currencies: string[];
  displayCurrency: string | null;
  note: string;
  frozenAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
}

export interface AdminApprovalsSectionProps {
  batches: IPendingBatch[];
}

/** A line under a person in the admin's review: a bonus, a deduction, or the loan installment. */
export type IItemType = "bonus" | "deduction" | "loan";

export interface IBreakdownItem {
  id: string;
  type: IItemType;
  amount: number;
  /** The reason HR gave (bonus, deduction); a loan has none. */
  description?: string;
}

export interface IEmployeeBatch {
  id: string;
  name: string;
  code: string;
  department: string;
  avatarUrl?: string;
  basicSalary: number;
  bonusTotal: number;
  deductionTotal: number;
  loanTotal: number;
  totalThisRun: number;
  breakdown: IBreakdownItem[];
  reviewStatus?: "APPROVED" | "REJECTED" | null;
  hrChangeNote?: string;
}

export interface IActivityLog {
  id: string;
  /** What happened, in the reader's language when the action is known (user names isolated). */
  title: React.ReactNode;
  /** Who did it: a person's name (isolated with <bdi>) or the translated "System". */
  user: React.ReactNode;
  timestamp: string;
  /** A note people wrote: shown as written. */
  details?: string;
}

/** Payroll activity sentences the page can translate (see utils/payrollActivity.ts). */
export type PayrollActivityKey =
  | "runStarted"
  | "runFrozen"
  | "runReopened"
  | "runReopenedWithdrawn"
  | "submitted"
  | "approvedAll"
  | "approvedRows"
  | "changeRequested"
  | "resubmitted"
  | "bonusAdded"
  | "deductionAdded"
  | "queuedAll"
  | "queued"
  | "markedPaidAll"
  | "markedPaid"
  | "paidEmployee"
  | "bankFileExported"
  | "payslipsSent"
  | "imported";

export interface PayrollActivityMatch {
  key: PayrollActivityKey;
  /** count for sentences with a number; name for a person's name or a file name. */
  values: { count?: number; name?: string };
}

export interface EmployeeApprovalCardProps {
  employee: IEmployeeBatch;
  /** The run's currency (ISO 4217). */
  currency?: string | null;
  onStatusChange: (id: string, status: "APPROVED" | "REJECTED" | null) => void;
  onNoteChange: (id: string, note: string) => void;
}

export interface SubmitForApprovalSheetProps {
  trigger: React.ReactNode;
  runId: number;
  employees: { id: number; name: string; amount: number | string }[];
  /** The run's currency (ISO 4217). */
  currency?: string | null;
}

export interface MoneyCellProps {
  value: number | null;
  /** A deduction or a loan: shown with a minus sign. */
  treatAsNegative?: boolean;
}

/** The translated labels of the payroll table's select-all / select-row checkboxes. */
export interface PayrollSelectColumnLabels {
  selectAll: string;
  /** "Select {name}" for one row. */
  selectRow: (name: string) => string;
}

/** A payslip's net pay: in the payslip's own currency when it has an ISO code, else the bare number. */
export interface PayslipMoneyCellProps {
  value: number;
  currency?: MyPayslipItem["currency"];
}
