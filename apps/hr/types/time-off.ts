import { IEmployee } from "./employee";

export type TimeOffStatus = "pending" | "approved" | "rejected" | "cancelled";
// Types for Time Off Request
export interface CreateTimeOffRequest {
  timeOffType: string; // e.g., 'sick', 'annual'
  durationType: string; // e.g., 'full_day', 'half_day', 'partial'
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  halfDayPeriod?: string; // Optional: 'morning' or 'afternoon'
  partialStartTime?: string; // Optional: 'HH:mm'
  partialEndTime?: string; // Optional: 'HH:mm'
  employeeNote?: string; // Optional note
  employeeUserId?: number; // HR only: Target employee ID
  files?: File[];
  // Array of files for multipart
}

// Typical API Response (adjust based on your actual backend response)
export interface TimeOffResponse {
  id: number;
  status: {
    hrAction: TimeOffStatus;
    managerAction: TimeOffStatus;
    overall: TimeOffStatus;
  };
  createdAt: string;
  // ... any other fields returned by your API
}

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
  hrActionStatus: string;
  managerActionStatus: string;
  durationType: "full_day" | "half_day" | "partial";
  halfDayPeriod?: "morning" | "afternoon" | null;
  startDate: string;
  endDate: string;
  totalDurationMinutes: number;
  partialStartTime?: string | null;
  partialEndTime?: string | null;
  employeeNote: string;
  decisionNote: any;
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
  hrActionStatus: string;
  managerActionStatus: string;
  durationType: "full_day" | "half_day" | "partial_day";
  halfDayPeriod: "morning" | "afternoon" | null;
  startDate: string;
  endDate: string;
  totalDurationMinutes: number;
  partialStartTime: string;
  partialEndTime: string;
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
  decidedAt: any;
  hrDecidedAt: any;
  managerDecidedAt: any;
  createdAt: string;

  updatedAt: string;
  employee: {
    id: number;
    avatar: string | null;
    fullName: string;
    discordUsername: string | null;
  };
}

export interface TimeOffDecisionRequest {
  status: TimeOffStatus;
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
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
