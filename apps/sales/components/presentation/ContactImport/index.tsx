"use client";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button, EmptyState, Select, Stepper, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useDealFormat } from "@/lib/deals/format";
import { parseCsv } from "@/mock/presentation";
import { contactImportDefaults, contactImportFields, mappedContacts } from "@/mock/presentation-import";
import { contactImportSchema } from "@/schemas/presentation-import";
import type { ContactImportProps, ContactImportValues } from "@/types/presentation-import";

export default function ContactImport({deals,rule,actor,currency,canManage,onImport}:ContactImportProps){
 const t=useTranslations("Presentation"),f=useDealFormat(),[step,setStep]=useState(0),[error,setError]=useState(""),[count,setCount]=useState(0),done=useRef(false);
 const form=useForm<ContactImportValues>({resolver:zodResolver(contactImportSchema(t("csvError"))),defaultValues:contactImportDefaults});
 const values=form.watch();
 const rows=useMemo(()=>{try{return parseCsv(values.csv)}catch{return []}},[values.csv]);
 const columns=(rows[0]??[]).map((label,index)=>({value:String(index),label:label||String(index+1)}));
 const preview=step===2?mappedContacts(rows,values,deals,rule,actor):null;
 const next=async()=>{
  if(!canManage||done.current||!(await form.trigger()))return;setError("");
  if(step===0){if(rows.length<2||rows.length>51||columns.length<5){setError(t("csvSourceError"));return;}setStep(1);return;}
  const mapped=mappedContacts(rows,values,deals,rule,actor);if(!mapped){setError(t("csvMappingError"));if(step===2)setStep(1);return;}
  if(step===1){setStep(2);return;}
  if(step===2){done.current=true;onImport(mapped);setCount(mapped.length);setStep(3);}
 };
 return <section className="flex flex-col gap-4"><Stepper label={t("import")} steps={["csvSource","csvMapping","csvReview","csvResult"].map((key,index)=>({id:String(index),label:t(key),state:index===step?"current":index<step?"complete":"upcoming"}))} onStepClick={step<3?id=>{setError("");setStep(Number(id))}:undefined}/>
 {step===0?<><p className="text-body-sm text-fg-muted">{t("csvSourceHint")}</p><RHFField control={form.control} name="csv" label={t("csvText")} render={field=><Textarea {...field} rows={6} disabled={!canManage}/>}/></>:null}
 {step===1?<><p className="text-body-sm text-fg-muted">{t("csvMappingHint")}</p><div className="grid gap-3 sm:grid-cols-2">{contactImportFields.map(name=><RHFField key={name} control={form.control} name={name} label={t(name==="name"?"contact":name)} render={field=><Select aria-label={t(name==="name"?"contact":name)} value={field.value} onValueChange={field.onChange} options={columns} disabled={!canManage}/>}/>)}</div></>:null}
 {step===2?<><p className="text-body-sm">{t("csvReviewCount",{count:preview?.length??0})}</p><div className="overflow-x-auto rounded-field border border-line"><table className="min-w-[520px] w-full text-body-sm"><caption className="sr-only">{t("csvReview")}</caption><thead className="bg-raised"><tr>{["contact","company","email","value","owner"].map(key=><th key={key} className="p-2 text-start">{t(key)}</th>)}</tr></thead><tbody>{preview?.map(deal=><tr key={deal.email} className="border-t border-line"><td className="p-2" dir="auto">{deal.name}</td><td className="p-2" dir="auto">{deal.company}</td><td className="p-2"><bdi>{deal.email}</bdi></td><td className="p-2">{f.money(deal.value,currency)}</td><td className="p-2" dir="auto">{deal.owner}</td></tr>)}</tbody></table></div></>:null}
 {step===3?<EmptyState size="compact" title={t("csvResult")} description={t("imported",{count})}/>:null}
 {error?<p role="alert" className="text-body-sm text-danger">{error}</p>:null}
 <div className="flex flex-wrap gap-2">{step>0&&step<3?<Button variant="secondary" onClick={()=>{setError("");setStep(step-1)}}>{t("csvBack")}</Button>:null}{step<3?<Button disabled={!canManage} onClick={next}>{t(step===2?"importRows":"csvContinue")}</Button>:<Button variant="secondary" onClick={()=>{done.current=false;form.reset();setStep(0);setError("");setCount(0)}}>{t("csvNewImport")}</Button>}</div>
 </section>;
}
