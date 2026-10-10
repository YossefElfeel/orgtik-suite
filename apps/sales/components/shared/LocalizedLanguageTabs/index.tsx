"use client";
import { Button } from "@orgtik/ui";
import type { CatalogLanguageOption } from "@/types/catalog-language";
import type { SupportedLanguage } from "@/types/localized";
export default function LocalizedLanguageTabs({languages,activeLanguage,setActiveLanguage,className,getHasError}:{languages:CatalogLanguageOption[];activeLanguage:SupportedLanguage;setActiveLanguage:(code:SupportedLanguage)=>void;size?:"lg"|"sm";className?:string;getHasError?:(code:SupportedLanguage)=>boolean}) {
  return languages.length>1?<div className={`flex flex-wrap gap-1 ${className||""}`}>{languages.map(language=><Button key={language.code} size="sm" shape="control" variant={activeLanguage===language.code?"secondary":"ghost"} aria-pressed={activeLanguage===language.code} aria-invalid={getHasError?.(language.code)||undefined} onClick={()=>setActiveLanguage(language.code)}>{language.nativeName}</Button>)}</div>:null;
}
