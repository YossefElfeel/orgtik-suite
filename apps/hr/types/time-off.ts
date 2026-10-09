import type { ReactNode } from 'react';

export type TimeOffStatus = "pending" | "approved" | "rejected" | "cancelled";
// Types for Time Off Request
export type TimeOffStage = 'hr' | 'manager';
export type TimeOffStageStatus = 'pending' | 'approved' | 'rejected';
export type TimeOffDuration = 'full_day' | 'half_day' | 'partial';
export type TimeOffType = TimeOffRequest['timeOffType'];
export interface CreateTimeOffRequest {
  timeOffType: TimeOffType;
  durationType: TimeOffDuration;
  /** Civil dates in the workspace timezone; never converted through the viewer's UTC offset. */
  startDate: string; endDate: string;
  employeeId?: number;
  halfDayPeriod?: 'morning' | 'afternoon';
  partialStartTime?: string; partialEndTime?: string;
  employeeNote?: string;
}

// Typical API Response (adjust based on your actual backend response)
export type TimeOffResponse = TimeOffRequestDetail;

// ---------------------------------------
export interface TimeOffAttachment {
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface TimeOffRequest {
  id: number;
  requestCode: string;
  employeeId: number;
  employeeDiscordUsername: string;
  employeeDepartment: string;
  timeOffType:
  | "annual_leave"
  | "sick_leave"
  | "personal_leave"
  | "vacation_day"
  | "bereavement_leave"
  | "medical_appointment"
  | "mental_health_day"
  | "training_day"
  | "public_holiday"
  | "unpaid_leave"
  | "other";
  status: TimeOffStatus;
  hrActionStatus: TimeOffStageStatus;
  managerActionStatus: TimeOffStageStatus;
  durationType: "full_day" | "half_day" | "partial";
  halfDayPeriod?: "morning" | "afternoon" | null;
  startDate: string;
  endDate: string;
  totalDurationMinutes: number;
  partialStartTime?: string | null;
  partialEndTime?: string | null;
  employeeNote: string;
  decisionNote: { reason: string } | null;
  attachments: TimeOffAttachment[];
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    fullName: string;
    avatar: string;
    departmentName: string;
  };
}

export interface TimeOffFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  status?: TimeOffStatus;
  timeOffType?: string;
  fromDate?: string;
  toDate?: string;
  search?: string; // HR Only
  employeeId?: number; // HR Only
  departmentId?: number; // HR Only
  managerUserId?: number; // HR Only
  employeeType?: "full_time" | "part_time" | "contractor" | "intern"; // HR Only
}

export interface TimeOffListResponse {
  success: boolean;
  message: string;
  data: {
    items: TimeOffRequest[];
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

// ----------------------------------
export interface TimeOffBalance {
  timeOffType: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface EmployeeTimeOffSummary {
  employeeId: number;
  ptoBalanceDays: number;
  pendingRequestsCount: number;
  usedDays: number;
  contractDaysPerYear: number;
  nationalDays: number;
}

export interface TimeOffOverviewData {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  approvedDurationMinutes: number;
  employeeSummary: EmployeeTimeOffSummary;
  balances: TimeOffBalance[];
}

export interface TimeOffAttachment {
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface TimeOffRequestDetail {
  id: number;
  requestCode: string;
  employeeId: number;
  employeeDiscordUsername: string;
  employeeDepartment: string;
  timeOffType: string;
  status: TimeOffStatus;
  hrActionStatus: TimeOffStageStatus;
  managerActionStatus: TimeOffStageStatus;
  durationType: TimeOffDuration;
  halfDayPeriod: "morning" | "afternoon" | null;
  startDate: string;
  endDate: string;
  totalDurationMinutes: number;
  partialStartTime: string | null;
  partialEndTime: string | null;
  employeeNote: string;
  decisionNote: {
    reason: string;
  };
  hrDecisionNote: string
  managerDecisionNote: string
  attachments: TimeOffAttachment[];
  decidedByUserId: number | null;
  hrDecidedByUserId: number | null;
  managerDecidedByUserId: number | null;
  decidedAt: string | null;
  hrDecidedAt: string | null;
  managerDecidedAt: string | null;
  createdAt: string;

  updatedAt: string;
  employee: {
    id: number;
    avatar: string | null;
    fullName: string;
    discordUsername: string | null;
  };
  capabilities: {
    canDecide: boolean; decisionStage: TimeOffStage | null;
    canCancel: boolean; readOnly: boolean; managerRequired: boolean;
  };
}

export interface TimeOffDecisionRequest {
  status: 'approved' | 'rejected';
  decisionNote?: string;
}

// --------------------------
export interface CreateMeetingRequest {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  link?: string;
  description?: string;
  targetType: "company" | "department" | "employees";
  departmentIds?: number[];
  employeeIds?: number[];
  sendToAll?: boolean;
}

export interface MeetingEmployee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  departmentName: string;
}

// The main Meeting interface
export interface Meeting {
  id: number;
  title: string;
  date: string; // "2026-11-13"
  time: string; // "14:00"
  durationMinutes: number;
  link: string | null;
  description: string | null;
  targetType: "company" | "department" | "employee";
  departmentIds: number[];
  employeeIds: number[];
  employees: MeetingEmployee[];
  createdByEmployee: MeetingEmployee;
  sendToAll: boolean;
  createdBy: number;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** A time off request dialog: opened by its trigger, or controlled (the calendar opens it). */
export interface TimeOffRequestDialogProps {
  id: number;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export type TimeOffScope = { realm: string; workspaceId: string; actorId: number | string };
export type CreateTimeOffMutation = { body: CreateTimeOffRequest; operationId: string; scope: TimeOffScope };
export type DecideTimeOffMutation = { id: number; body: TimeOffDecisionRequest; operationId: string; scope: TimeOffScope };
export type CancelTimeOffMutation = { id: number; operationId: string; scope: TimeOffScope };
export type TimeOffAttempt = { kind: 'create'; request: CreateTimeOffMutation; uncertain: boolean }
  | { kind: 'decision'; request: DecideTimeOffMutation; stage: TimeOffStage; uncertain: boolean }
  | { kind: 'cancel'; request: CancelTimeOffMutation; uncertain: boolean };
export type AddTimeOffFormValues = {
  employeeId: string; timeOffType: TimeOffType; durationType: TimeOffDuration;
  startDate: string; endDate: string; halfDayPeriod: 'morning' | 'afternoon';
  partialStartTime: string; partialEndTime: string; employeeNote: string;
};
export type AddTimeOffFormInput = AddTimeOffFormValues;
export type DecisionFormValues = { decision: 'approved' | 'rejected'; note: string };
export type TimeOffActionDialogProps = TimeOffRequestDialogProps & { status?: TimeOffStatus; onSave?: (data: DecisionFormValues) => void };
export type LeaveRequestSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: "2xl";
  trigger?: import("react").ReactNode;
  children: import("react").ReactNode;
  footer?: import("react").ReactNode;
};
