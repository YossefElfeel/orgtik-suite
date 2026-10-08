import { z } from "zod";
export const directoryPickSchema = (required: string) => z.object({ directoryId: z.string().min(1, required) });
