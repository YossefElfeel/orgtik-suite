export interface IEmployee {
  id: number;
  name: string;
  avatar: string;
  jobTitle: string | null;
  department: {
    id: number;
    name: string;
  };
}
export interface IAttendanceSummary {
  from: string;
  to: string;
  totalSessions: number;
  closedSessions: number;
  totalWorkSeconds: number;
  totalBreakSeconds: number;
  totalLateSeconds: number;
  lateOccurrences: number;
  attendanceRate: number;
  attendanceRateLabel: string;
  presentDays: number;
  absentDays: number;
  workingDays: number;
  totalWorkLabel: string;
  onTimeRate: number;
  onTimeRateLabel: string;
  absenteeismRate: number;
  absenteeismRateLabel: string;
  absenteeismDays: number;
  absenteeismLabel: string;
  totalWorkTime: string;
  employeeAttendanceLabel: string;
  expectedWorkSeconds: number;
  expectedWorkLabel: string;
  workCompletionRate: number;
  workCompletionRateLabel: string;

  attendanceCard: IAttendanceCard;
  employeeAttendance: IEmployeeAttendance;
  totalLogHours: ITotalLogHours;
  workingHourPerformance: IWorkingHourPerformance;
  insight: IInsight;
}

interface IAttendanceCard {
  attendanceRate: number;
  attendanceRateLabel: string;
  onTimeRate: number;
  onTimeRateLabel: string;
  lateOccurrences: number;
  absentDays: number;
  absentDaysLabel: string;
}

interface IEmployeeAttendance {
  presentDays: number;
  workingDays: number;
  label: string;
  lastWeekPercentageDelta: number;
}

interface ITotalLogHours {
  totalWorkSeconds: number;
  totalWorkLabel: string;
  expectedWorkSeconds: number;
  expectedWorkLabel: string;
  label: string;
  lastWeekPercentageDelta: number;
}

interface IWorkingHourPerformance {
  performanceRate: number;
  performanceRateLabel: string;
  workCompletionRate: number;
  workCompletionRateLabel: string;
  workingHourSeconds: number;
  workingHour: string;
}

interface IInsight {
  absenteeismRate: number;
  absenteeismRateLabel: string;
  absenteeismDays: number;
  absenteeismLabel: string;
  lateOccurrences: number;
  totalWorkTime: string;
  totalWorkSeconds: number;
  attendanceRate: number;
  attendanceRateLabel: string;
}
export interface IAttendanceSummaryParams {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  excludeWeekends?: boolean;
  workingDays?: string;
  departmentId?: number;
  managerUserId?: number;
  employeeType?: string;
  search?: string;
}
// --------------------------------------------------------------------
export interface IAttendanceSession {
  id: number;
  employeeId: number;
  employee: IEmployee;
  discordUserId: string;
  channelId: string;
  checkInAt: string;
  checkOutAt: string;
  durationSeconds: number;
  breakBeforeSeconds: number;
  lateSeconds: number;
  isLate: boolean;
  startWork: string;
  endWork: string;
  status: "approved" | "late" | string;
  logHours: string;
  overtime: number;
  late: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendanceSessionsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  employeeId?: number;
  discordUserId?: string;
  startDate?: string;
  endDate?: string;
  isLate?: boolean;
  departmentId?: number;
  managerUserId?: number;
  employeeType?: "full_time" | "part_time" | "contractor" | "intern";
  search?: string;
}
// ------------------------------------------------
export interface IAttendanceLeave {
  id: number;
  employeeId: number;
  employee: IEmployee;
  leaveDate: string;
  startWorkAt: string | null;
  endWorkAt: string | null;
  status: string;
  logHoursSeconds: number;
  leaveType: string;
  note: string;
  createdAt: string;
}
export interface IAttendanceLeaveParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  employeeId?: number;
  status?: IAttendanceLeave["status"];
  leaveType?: "discord_voice_leave";
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  managerUserId?: number;
  employeeType?: "full_time" | "part_time" | "contractor" | "intern";
  search?: string;
}

// -------------------------------- ---------

export interface IAttendanceAbsenceItem {
  id: number; 
  employeeId: number;
  employee: IEmployee; 
  date: string;
  isPresent: boolean;
  isAbsent: boolean;
  isLate: boolean;
  isWorkingDay?: boolean; 
  minimumRequiredSeconds?: number;
  isHalfDay?: boolean;
  attendanceClass?: "absent" | "non_working_day" | "present" | string;
  totalDurationSeconds: number;
  totalBreakSeconds: number;
  sessionsCount: number;
}

export interface IAttendanceAbsenceData {
  from: string;
  to: string;
  totalEmployees: number;
  totalDays: number;
  items: IAttendanceAbsenceItem[];
}

export interface IAttendanceAbsenceParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  from: string; // ISO Date string (e.g., 2026-04-01)
  to: string; // ISO Date string
  departmentId?: number;
  managerUserId?: number;
  employeeType?: "full_time" | "part_time" | "contractor" | "intern";
  search?: string;
}

// ----------------------------------------------------------
export interface IAttendanceDayOff {
  id: number;
  employeeId: number;
  employee: IEmployee;
  date: string;
  type:
    | "weekend"
    | "public_holiday"
    | "company_closure"
    | "approved_leave"
    | "approved_special_off"
    | "manual_override";
  typeLabel: string;
  sourceType: "schedule" | "calendar" | "time_off_request" | "manual";
  sourceId: string | number | null;
  createdAt: string;
}

export interface IAttendanceDayOffParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  employeeId?: number;
  type?: string;
  sourceType?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  managerId?: number;
  employeeType?: string;
  search?: string;
}
