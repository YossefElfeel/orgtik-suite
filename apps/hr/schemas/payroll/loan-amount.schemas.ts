import { z } from "zod";
export const loanAmountSchema = (message: string) => z.object({ loanId: z.string().min(1, message), amount: z.number().finite().positive(message) });
