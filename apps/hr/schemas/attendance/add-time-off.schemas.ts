import { z } from 'zod';

const validDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const makeAddTimeOffSchema = (messages: {
  typeRequired: string; startDateRequired: string; endDateRequired: string;
  customHoursRequired: string; dateOrder: string; timeOrder: string; employee: string; note: string;
}) => z.object({
  employeeId: z.string(),
  timeOffType: z.enum(['annual_leave', 'sick_leave', 'personal_leave', 'vacation_day', 'bereavement_leave', 'medical_appointment', 'mental_health_day', 'training_day', 'public_holiday', 'unpaid_leave', 'other'], { message: messages.typeRequired }),
  durationType: z.enum(['full_day', 'half_day', 'partial']),
  startDate: z.string(), endDate: z.string(),
  halfDayPeriod: z.enum(['morning', 'afternoon']),
  partialStartTime: z.string(), partialEndTime: z.string(), employeeNote: z.string().max(2000, messages.note),
}).superRefine((data, context) => {
  if (data.employeeId && (!/^\d+$/.test(data.employeeId) || !Number.isSafeInteger(Number(data.employeeId)) || Number(data.employeeId) < 1)) context.addIssue({ code: 'custom', path: ['employeeId'], message: messages.employee });
  if (!validDay(data.startDate)) context.addIssue({ code: 'custom', path: ['startDate'], message: messages.startDateRequired });
  if (data.durationType === 'full_day') {
    if (!validDay(data.endDate)) context.addIssue({ code: 'custom', path: ['endDate'], message: messages.endDateRequired });
    else if (data.endDate < data.startDate) context.addIssue({ code: 'custom', path: ['endDate'], message: messages.dateOrder });
  }
  if (data.durationType === 'partial') {
    if (!validTime(data.partialStartTime)) context.addIssue({ code: 'custom', path: ['partialStartTime'], message: messages.customHoursRequired });
    if (!validTime(data.partialEndTime)) context.addIssue({ code: 'custom', path: ['partialEndTime'], message: messages.customHoursRequired });
    else if (validTime(data.partialStartTime) && data.partialEndTime <= data.partialStartTime) context.addIssue({ code: 'custom', path: ['partialEndTime'], message: messages.timeOrder });
  }
});
