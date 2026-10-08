import { z } from "zod";
export const policySchema = (message: string) => z.object({ annual: z.string().refine(value => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 60, message), carry: z.string().refine(value => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 30, message), accrual: z.enum(["annual", "monthly"]) });
export const profileSchema = (message: string) => z.object({ email: z.string().email(message).max(160, message), phone: z.string().trim().min(7, message).max(30, message) });
export const hrImportSchema = (message: string) => z.object({ csv: z.string().min(1, message).max(100000, message), nameColumn: z.string(), emailColumn: z.string(), currencyColumn: z.string() });
