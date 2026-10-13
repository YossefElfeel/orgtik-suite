import { z } from "zod";
export const employeeFieldSchema = (message: string) => z.object({ definitions: z.array(z.object({ id: z.string().min(1), name: z.string().trim().min(1, message).max(80), type: z.enum(["text", "number", "date", "select"]), choices: z.string().max(2400) })).max(30) });

export const employeeValuesSchema = z.object({ values: z.record(z.string(), z.string().max(2000)) });
