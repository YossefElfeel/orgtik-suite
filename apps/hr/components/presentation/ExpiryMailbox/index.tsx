"use client";
import { useTranslations } from "next-intl";
import { Badge, Button, EmptyState, MailboxPreview, useFormatter } from "@orgtik/ui";
import { HR_DEMO_TODAY } from "@/mock/presentation";
import type { MailboxProps } from "@/types/presentation";
export default function ExpiryMailbox({ employees, messages, canManage, onRemind }: MailboxProps) {
  const t = useTranslations("HrPresentation"), f = useFormatter(), cutoff = "2026-11-07";
  return <div className="grid items-start gap-5 lg:grid-cols-2"><section className="rounded-panel border border-line bg-raised p-4"><h2 className="mb-3 text-title-sm font-semibold">{t("expiry")}</h2><p className="mb-4 text-body-sm text-fg-muted">{t("expiryNote")}</p><ul className="divide-y divide-line">{employees.filter(person => person.documentExpiry <= cutoff).map(person => <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p dir="auto" className="text-body font-semibold">{person.name}</p><p className="mt-1 text-body-sm text-fg-muted">{f.date(new Date(person.documentExpiry + "T12:00:00Z"), { dateStyle: "medium", timeZone: "UTC" })}</p><Badge size="sm" tone="warning">{t(person.documentExpiry < HR_DEMO_TODAY ? "expired" : "expiresSoon")}</Badge></div><Button size="sm" variant="secondary" disabled={!canManage} onClick={() => onRemind(person.id)}>{t("sendReminder")}</Button></li>)}</ul>{!employees.some(person => person.documentExpiry <= cutoff) ? <EmptyState size="compact" title={t("noExpiry")} /> : null}</section><MailboxPreview title={t("mailbox")} description={t("mailboxNote")} emptyTitle={t("noMail")} entries={messages.map(message => ({ id: message.id, subject: t(message.subjectKey), recipient: employees.find(person => person.id === message.employeeId)?.email }))} /></div>;
}
