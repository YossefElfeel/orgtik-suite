import { z } from 'zod';

export function offboardingSchema(today: string, successorRequired: boolean, messages: { date: string; successor: string }) {
  return z.object({ mode: z.enum(['now', 'date']), effectiveDate: z.string(), ownerMemberId: z.string() }).superRefine((value, ctx) => {
    if (value.mode === 'date') {
      const valid = /^\d{4}-\d{2}-\d{2}$/.test(value.effectiveDate) && Number.isFinite(Date.parse(value.effectiveDate)) && new Date(value.effectiveDate).toISOString().slice(0, 10) === value.effectiveDate;
      if (!valid || value.effectiveDate < today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['effectiveDate'], message: messages.date });
    }
    if (successorRequired && !value.ownerMemberId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ownerMemberId'], message: messages.successor });
  });
}

export const offboardingActionSchema = (message: string) => z.object({ note: z.string().max(1000, message) });
