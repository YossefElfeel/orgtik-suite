import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { EmailDesign } from "@/types/marketing-v3";
export function marketingErrorStatus(error: unknown) {
  return error && typeof error === "object" && "status" in error
    ? (error as FetchBaseQueryError).status
    : undefined;
}
export function marketingTaskState(value:string){
 if(value==="completed")return "done";
 if(value==="backlog"||value==="todo"||value==="in_progress"||value==="in_review"||value==="done")return value;
 return null;
}
export function safeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] || character,
  );
}
export function emailPreviewHtml(
  values: EmailDesign,
  locale: string,
  providerLabel: string,
) {
  const line = (value: string) =>
    `${values.format.bold ? "<strong>" : ""}${values.format.italic ? "<em>" : ""}${safeHtml(value)}${values.format.italic ? "</em>" : ""}${values.format.bold ? "</strong>" : ""}`;
  const body = values.format.bullets
    ? `<ul>${values.body
        .split(/\r?\n/)
        .filter(Boolean)
        .map((value) => `<li>${line(value)}</li>`)
        .join("")}</ul>`
    : `<p style="white-space:pre-wrap">${line(values.body)}</p>`;
  return `<!doctype html><html lang="${locale}" dir="${values.direction}"><head><meta charset="utf-8"><style>body{font:16px/1.6 Arial,sans-serif;margin:0;color:#25232c;background:#fff}main{max-width:600px;padding:32px;margin:auto}h1{font-size:28px;line-height:1.25}footer{border-top:1px solid #ddd;padding-top:20px;font-size:13px}a{color:#653666}li{margin-bottom:8px}</style></head><body><main><h1>${safeHtml(values.headline)}</h1>${body}${values.cta && values.ctaUrl ? `<p><a href="${safeHtml(values.ctaUrl)}">${safeHtml(values.cta)}</a></p>` : ""}<footer>${safeHtml(values.companyName)} · ${safeHtml(values.postalAddress)}<p>${safeHtml(providerLabel)}</p></footer></main></body></html>`;
}
