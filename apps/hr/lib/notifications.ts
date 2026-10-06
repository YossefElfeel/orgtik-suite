import { API_URL } from "@/constants";
import type { NotificationDto } from "@/types/notifications";

/**
 * Socket.IO connects to the API origin without the `/api` suffix, at `/notifications`.
 */
export function getNotificationsSocketUrl(): string {
  const raw = (API_URL ?? "").trim().replace(/\/+$/, "");
  const origin = raw.replace(/\/api\/?$/i, "");
  return `${origin || raw}/notifications`;
}

/**
 * Maps backend entity types to dashboard routes (locale is applied by next-intl router).
 */
export function getNotificationHref(
  notification: Pick<NotificationDto, "entityType" | "entityId">,
): string | null {
  const id = notification.entityId?.trim();
  const type = notification.entityType;

  if (!type) {
    return null;
  }

  switch (type) {
    case "Ticket":
      return id ? `/tickets/${encodeURIComponent(id)}` : "/tickets";
    case "AttendanceTimeOff":
      return "/time-off";
    case "AttendanceDaily":
      return "/attendance";
    case "Meeting":
      return "/calendar";
    case "PayrollItem":
    case "PayrollBatch":
      return id ? `/payroll/${encodeURIComponent(id)}` : "/payroll";
    case "EmployeeLoan":
      return id ? `/payroll/loans/${encodeURIComponent(id)}` : "/payroll";
    case "Employee":
      return id ? `/employees/${encodeURIComponent(id)}` : "/employees";
    case "Department":
      return id ? `/department/${encodeURIComponent(id)}` : "/department";
    case "Job":
      return id ? `/hiring/overall/${encodeURIComponent(id)}` : "/hiring/overall";
    case "JobApplication":
      return id ? `/candidates/${encodeURIComponent(id)}` : "/candidates";
    case "InterviewAppointment":
      return "/calendar";
    default:
      return null;
  }
}
