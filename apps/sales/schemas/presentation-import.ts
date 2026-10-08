import { z } from "zod";
export const contactImportSchema=(message:string)=>z.object({csv:z.string().min(1,message).max(100000,message),name:z.string(),company:z.string(),email:z.string(),value:z.string(),source:z.string()});
