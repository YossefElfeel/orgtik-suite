"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, ConfirmDialog, demoRequest, useDemoScene } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import type { DemoWorkspaceReceipt, WorkspaceReceiptProps } from "@/types/presentation";

export default function WorkspaceReceipt({deal,canManage}:WorkspaceReceiptProps){
 const t=useTranslations("Presentation"),demo=useDemoScene(),[confirm,setConfirm]=useState(false),[receipt,setReceipt]=useState<DemoWorkspaceReceipt|null>(null),[failed,setFailed]=useState(false),[checking,setChecking]=useState(false);
 const allowed=canManage&&demo.scene.workspace==="orgtik"&&["current","mona"].includes(demo.scene.persona);
 useEffect(()=>{setReceipt(null);setFailed(false);if(!allowed)return;if(!demo.runtime){try{const saved=sessionStorage.getItem(`orgtik:presentation:sales:receipt:${deal.id}`);if(saved)setReceipt(JSON.parse(saved))}catch{}return;}let live=true;setChecking(true);demoRequest<DemoWorkspaceReceipt[]>(demo.runtime,demo.scene,"/workspaces").then(rows=>{if(live)setReceipt(rows.find(row=>row.dealId===deal.id)??null)}).catch(()=>{if(live)setFailed(true)}).finally(()=>{if(live)setChecking(false)});return()=>{live=false}},[deal.id,allowed,demo.runtime]);
 const create=async()=>{
  if(!allowed||deal.stage!=="won"||receipt)return;
  const record=demo.runtime?await demoRequest<DemoWorkspaceReceipt>(demo.runtime,demo.scene,"/workspaces",{name:deal.company,owner:deal.name,dealId:deal.id}):{id:`WORKSPACE-DEMO-${crypto.randomUUID()}`,name:deal.company,owner:deal.name,dealId:deal.id,workspace:"orgtik",simulated:true as const};if(!demo.runtime)try{sessionStorage.setItem(`orgtik:presentation:sales:receipt:${deal.id}`,JSON.stringify(record))}catch{}setReceipt(record);setFailed(false);
 };
 return <section className="flex flex-col gap-3 border-t border-line pt-4"><h3 className="font-semibold">{t("workspaceReceipt")}</h3><p className="text-body-sm text-fg-muted">{t("workspaceReceiptHint")}</p>{allowed?receipt?<div role="status" className="rounded-field border border-line bg-raised p-3"><Badge tone="success">{t("workspaceReady")}</Badge><dl className="mt-3 grid grid-cols-[1fr_2fr] gap-2 text-body-sm"><dt>{t("quoteReference")}</dt><dd><bdi>{receipt.id}</bdi></dd><dt>{t("quoteWorkspace")}</dt><dd dir="auto">{receipt.name}</dd><dt>{t("workspaceOwner")}</dt><dd dir="auto">{receipt.owner}</dd></dl></div>:<><Button size="sm" className="self-start" loading={checking} disabled={checking} onClick={()=>setConfirm(true)}>{t(failed?"retryWorkspace":"createWorkspace")}</Button>{failed?<p role="alert" className="text-body-sm text-danger">{t("workspaceReadFailed")}</p>:null}</>:<p className="text-body-sm text-fg-muted">{t("workspaceStaffOnly")}</p>}<p className="text-caption text-fg-muted">{t(demo.runtime?"workspaceConnected":"workspaceLocal")}</p><ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t("workspaceConfirm")} impact={t("workspaceImpact",{name:isolate(deal.company),owner:isolate(deal.name)})} confirmLabel={t("createWorkspace")} tone="primary" onConfirm={create}/></section>;
}
