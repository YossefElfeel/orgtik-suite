import type { ReactNode } from "react";

export type AttendanceRow = {
  id: string;
  dateFrom: string;
  startWork: string;
  endWork: string;
  status: string;
  logHours: string;
  overtime: string;
};

export type LeaveBalanceCard = {
  id: string;
  value: string;
  sub: string;
};

export type LeaveRow = {
  id: string;
  type: string;
  dateFrom: string;
  duration: string;
  dateTo: string;
  status: string;
  note: string;
};

export type FinanceTabKey = "paroles" | "bonus" | "deductions" | "loans";

export type ParoleRow = {
  id: string;
  date: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  status: "Pending" | "Approved";
  totalSalary: number;
};

export type BonusRow = {
  id: string;
  date: string;
  bonus: number;
  reason: string;
};

export type DeductionRow = {
  id: string;
  date: string;
  deduction: number;
  reason: string;
};

export type LoanRow = {
  id: string;
  date: string;
  paid: number;
  remaining: number;
};

export type LoanTotals = {
  totalLoan: number;
  paidLoan: number;
  remainsLoan: number;
  paidMonthly: number;
};

export type AttachmentItem = {
  id: string;
  name: string;
  size: string;
  url: string;
};

export type ActivityItem = {
  id: string;
  body: ReactNode;
  timestamp: string;
};

export type Employee = {
  fullName: string;
  avatarUrl: string;
  workEmail: string;
  personalEmail: string;
  phone: string;
  department: string;
  position: string;
  branch: string;
  reportingManager: string;
  joinDate: string;
  employmentType: string;
  displayEmployeeId: string;
};
