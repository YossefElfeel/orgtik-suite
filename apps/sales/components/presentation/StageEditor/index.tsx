"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, ArrowDown, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Button, ConfirmDialog, Input } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { stageEditorSchema } from "@/schemas/presentation-stages";
import type { StageEditorProps, StageEditorValues } from "@/types/presentation-stages";

export default function StageEditor({stages,deals,canManage,labelOf,onChange}:StageEditorProps){
 const t=useTranslations("Presentation"),[editing,setEditing]=useState<string|null>(null),[error,setError]=useState(""),[removing,setRemoving]=useState<string|null>(null);
 const form=useForm<StageEditorValues>({resolver:zodResolver(stageEditorSchema(t("stageDefinitionError"))),defaultValues:{label:"",probability:50}});
 const current=stages.find(stage=>stage.id===editing),terminal=current&&["won","lost"].includes(current.id);
 const move=(index:number,offset:number)=>{if(!canManage)return;const next=[...stages],other=next[index+offset];if(!other)return;next[index+offset]=next[index]!;next[index]=other;onChange(next)};
 const save=async()=>{
  if(!canManage||!(await form.trigger()))return;const values=form.getValues(),label=values.label.trim();
  if(stages.some(stage=>stage.id!==editing&&labelOf(stage.id).toLocaleLowerCase()===label.toLocaleLowerCase())){setError(t("stageDuplicateError"));return;}
  const next=current?stages.map(stage=>stage.id===current.id?{...stage,label,probability:terminal?stage.probability:Number(values.probability)}:stage):[...stages,{id:`stage-${crypto.randomUUID()}`,label,probability:Number(values.probability),custom:true}];onChange(next);setEditing(null);setError("");form.reset();
 };
 return <section className="flex flex-col gap-4 border-y border-line py-4"><div><h2 className="text-title-sm font-semibold">{t("stageDefinitions")}</h2><p className="mt-2 max-w-[75ch] text-body-sm text-fg-muted">{t("stageDefinitionsHint")}</p></div><ol className="divide-y divide-line">{stages.map((stage,index)=>{const count=deals.filter(deal=>deal.stage===stage.id).length;return <li key={stage.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><span dir="auto" className="font-semibold">{labelOf(stage.id)}</span><p className="mt-1 text-caption text-fg-muted">{t("stageSummary",{count,probability:stage.probability})}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" startIcon={<ArrowUp/>} aria-label={t("stageEarlier",{name:labelOf(stage.id)})} disabled={!canManage||index===0} onClick={()=>move(index,-1)}>{t("earlier")}</Button><Button size="sm" variant="secondary" startIcon={<ArrowDown/>} aria-label={t("stageLater",{name:labelOf(stage.id)})} disabled={!canManage||index===stages.length-1} onClick={()=>move(index,1)}>{t("later")}</Button><Button size="sm" variant="secondary" startIcon={<PencilSimple/>} aria-label={t("editStage",{name:labelOf(stage.id)})} disabled={!canManage} onClick={()=>{setEditing(stage.id);setError("");form.reset({label:labelOf(stage.id),probability:stage.probability})}}>{t("editStageShort")}</Button>{stage.custom?<Button size="sm" variant="ghost" startIcon={<Trash/>} disabled={!canManage||count>0} onClick={()=>setRemoving(stage.id)}>{t("remove")}</Button>:null}</div></li>})}</ol>
 <Button size="sm" variant="secondary" className="self-start" startIcon={<Plus/>} disabled={!canManage||stages.length>=15} onClick={()=>{setEditing("__new");setError("");form.reset({label:"",probability:50})}}>{t("addStage")}</Button>
 {editing!==null?<div className="grid gap-3 sm:grid-cols-2"><RHFField control={form.control} name="label" label={t("stageName")} render={field=><Input {...field} disabled={!canManage}/>}/><RHFField control={form.control} name="probability" label={t("defaultProbability")} render={field=><Input {...field} type="number" min="0" max="100" disabled={!canManage||Boolean(terminal)}/>}/><div className="flex gap-2"><Button size="sm" disabled={!canManage} onClick={save}>{t("saveStage")}</Button><Button size="sm" variant="secondary" onClick={()=>{setEditing(null);setError("")}}>{t("cancel")}</Button></div>{error?<p role="alert" className="text-body-sm text-danger">{error}</p>:null}</div>:null}
 <ConfirmDialog open={Boolean(removing)} onOpenChange={open=>!open&&setRemoving(null)} title={t("remove")} impact={removing?labelOf(removing):""} confirmLabel={t("remove")} onConfirm={()=>{if(canManage&&removing&&!deals.some(deal=>deal.stage===removing)){onChange(stages.filter(stage=>stage.id!==removing));if(editing===removing)setEditing(null);setRemoving(null);}}}/>
 </section>;
}
