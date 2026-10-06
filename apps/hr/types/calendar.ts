import type { CalendarDate } from "@internationalized/date";
import type { Tone } from "@orgtik/ui";

export type CalendarEventType = "meeting" | "timeOff" | "task" | "publicHoliday";

export type ICalendarEvent = IMeetingEvent | ITimeOffEvent | ITaskEvent | IPublicHolidayEvent;

export interface IMeetingEvent {
  type: "meeting";
  id: number;
  date: string;
  title: string;
  time: string;
  startAt: string;
  endAt: string;
  interviewWith: string | null;
  interviewLink: string | null;
  /** The meeting link (an interview's is also in interviewLink). */
  link?: string | null;
  durationMinutes?: number;

  /** Set for an interview; null for a company or team meeting. */
  candidate: {
    fullName: string;
    email: string;
  } | null;

  job: {
    id: number;
    title: string;
  } | null;
}

export interface ITimeOffEvent {
  type: "timeOff";
  id: number;
  date: string;
  title: string;

  timeOffType: string;
  status: string;
  startDate: string;
  endDate: string;
  durationType: string;

  employee: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

export interface ITaskEvent {
  type: "task";
  id: number;
  date: string;
  title: string;

  priority: string;
  status: string;
  startDate: string;
  dueDate: string;

  projectId: number;
  projectTitle: string;
}

export interface IPublicHolidayEvent {
  type: "publicHoliday";
  id: number;
  date: string;
  title: string;
}

export type CalendarDays = Record<string, ICalendarEvent[]>;

/** One event on the library CalendarGrid (FS-HR-4): a leave spans its days once, not once per day. */
export type HrCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  tone?: Tone;
  source: ICalendarEvent;
};

export interface ICalendarSummary {
  meetings: number;
  timeOff: number;
  publicHolidays: number;
}

export interface ICalendarResponse {
  period: string;
  startDate: string;
  endDate: string;
  summary: ICalendarSummary;
  days: CalendarDays;
}

/** A public holiday dialog: opened by its trigger, or controlled (the calendar opens it). */
export interface PublicHolidayDialogProps {
  title: string;
  date: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** A meeting's details: opened by its trigger (children), or controlled (the calendar opens it). */
export interface MeetingDetailsDialogProps {
  meeting: IMeetingEvent;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** HR's calendar (FS-HR-4): the month and view live in the address; the page owns them. */
export interface CalendarViewProps {
  days: CalendarDays;
  view: "month" | "week";
  /** The month shown (any day in it); in week view, a day of the week shown. */
  month: CalendarDate;
  onViewChange: (view: "month" | "week") => void;
  onMonthChange: (date: CalendarDate) => void;
  status: "loading" | "error" | "ready";
  onRetry?: () => void;
}
