"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, SimulatedTag } from "@orgtik/ui";
import { Printer } from "@phosphor-icons/react";
import type { DemoDeal } from "@/types/presentation";
import { useDealFormat } from "@/lib/deals/format";

const escapeHtml=(value:string)=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");

export default function QuotePreview({deal,currency,workspaceName}:{deal:DemoDeal;currency:string;workspaceName:string}){
 const t=useTranslations("Presentation"),locale=useLocale(),f=useDealFormat(),[error,setError]=useState(false);
 const amount=f.money(deal.value,currency),expiry=f.date(deal.offer.validUntil);
 const print=()=>{
  const preview=window.open("","_blank","popup,width=900,height=850");
  if(!preview){setError(true);return;}setError(false);
  const row=(label:string,value:string)=>`<dt>${escapeHtml(label)}</dt><dd dir="auto">${escapeHtml(value)}</dd>`;
  preview.document.write(`<!doctype html><html lang="${escapeHtml(locale)}" dir="${locale==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${escapeHtml(t("quoteDocument"))}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:48px auto;padding:24px;color:CanvasText;background:Canvas}h1{font-size:32px}dl{display:grid;grid-template-columns:1fr 2fr;gap:14px}dt{font-weight:600}dd{margin:0}footer{border-top:1px solid currentColor;margin-top:32px;padding-top:16px}button{font:inherit;padding:10px 18px}@media print{button{display:none}body{margin:0;padding:24px}}</style></head><body><h1>${escapeHtml(t("quoteDocument"))}</h1><p>${escapeHtml(t("quoteSimulated"))}</p><dl>${row(t("quoteWorkspace"),workspaceName)}${row(t("company"),deal.company)}${row(t("contact"),deal.name)}${row(t("email"),deal.email)}${row(t("quoteReference"),deal.id)}${row(t("value"),amount)}${row(t("validUntil"),expiry)}${row(t("signer"),deal.offer.signedBy||t("pending"))}</dl><footer>${escapeHtml(t("quotePrintHint"))}</footer><button onclick="window.print()">${escapeHtml(t("printQuote"))}</button></body></html>`);
  preview.document.close();preview.focus();
 };
 return <section aria-label={t("quoteDocument")} className="mt-4 flex flex-col gap-3 rounded-field border border-line bg-raised p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold">{t("quoteDocument")}</h4><SimulatedTag/></div><dl className="grid grid-cols-[1fr_2fr] gap-2 text-body-sm"><dt className="text-fg-muted">{t("company")}</dt><dd dir="auto">{deal.company}</dd><dt className="text-fg-muted">{t("value")}</dt><dd className="tabular-nums">{amount}</dd><dt className="text-fg-muted">{t("validUntil")}</dt><dd>{expiry}</dd></dl><p className="text-caption text-fg-muted">{t("quotePrintHint")}</p><Button size="sm" variant="secondary" className="self-start" startIcon={<Printer/>} onClick={print}>{t("previewPrintQuote")}</Button>{error&&<p role="alert" className="text-body-sm text-danger">{t("quotePopupBlocked")}</p>}</section>;
}
