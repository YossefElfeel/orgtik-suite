import type { ContactImportField, ContactImportValues, ContactImportProps } from "@/types/presentation-import";
import { createDeal } from "./presentation";
export const contactImportFields:ContactImportField[]=["name","company","email","value","source"];
export const contactImportDefaults:ContactImportValues={csv:"contact,organisation,email,amount,channel\nAmal Karim,Bluebird Studio,amal@bluebird.example,5000,website",name:"0",company:"1",email:"2",value:"3",source:"4"};
export function mappedContacts(rows:string[][],values:ContactImportValues,existing:ContactImportProps["deals"],rule:ContactImportProps["rule"],actor:string){
 if(rows.length<2||rows.length>51||new Set(contactImportFields.map(field=>values[field])).size!==5)return null;
 const width=rows[0]?.length??0,emails=new Set(existing.map(deal=>deal.email.toLowerCase()));
 const indexes=contactImportFields.map(field=>Number(values[field]));if(indexes.some(index=>!Number.isInteger(index)||index<0||index>=width))return null;
 const imported=[];
 for(const row of rows.slice(1)){
  if(row.length!==width)return null;
  const [name,company,email,amount,source]=indexes.map(index=>row[index]?.trim()??"");const value=Number(amount);
  if(!name||name.length>120||!company||company.length>120||!email||email.length>160||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||emails.has(email.toLowerCase())||!amount||!Number.isFinite(value)||value<0||!source||source.length>80)return null;
  emails.add(email.toLowerCase());imported.push(createDeal(name,company,email,value,source,rule.enabled&&source===rule.source?rule.owner:actor));
 }
 return imported;
}
