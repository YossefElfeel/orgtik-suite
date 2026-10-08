import { z } from "zod";
export const stageEditorSchema=(message:string)=>z.object({label:z.string().trim().min(1,message).max(60,message),probability:z.coerce.number().min(0,message).max(100,message)});
