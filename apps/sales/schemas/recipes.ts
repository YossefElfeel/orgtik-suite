import { z } from "zod";
export const crmRecipeSchema = (message: string) => z.object({ recipes: z.array(z.object({ id: z.string(), title: z.string().trim().min(1, message).max(240), pipelineId: z.string().min(1, message), stageId: z.string().min(1, message), projectId: z.number().int().positive(message), sectionId: z.number().int().positive(message), enabled: z.boolean() })).max(20) });
