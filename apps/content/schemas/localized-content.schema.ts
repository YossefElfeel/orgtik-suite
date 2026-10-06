import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import { z, ZodObject, ZodString } from "zod";

export type LocalizedSchemaType = ZodObject<{
  [K in WebsiteLanguages]: ZodString;
}>;

export const localizeSchema: LocalizedSchemaType = z.object(
  Object.fromEntries(
    WEBSITE_LANGUAGES.map((lang) => [
      lang.code,
      z.string().min(1, `${lang.name} field is required`),
    ])
  )
) as LocalizedSchemaType;
