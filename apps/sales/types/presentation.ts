import type { LeadStatus } from "./customers";
import type { ReactNode } from "react";
export type DemoDeal = { id: string; name: string; company: string; email: string; source: string; stage: LeadStatus; value: number; probability: number; owner: string; tags: string[]; fields: Record<string, string>; lostReason: string; timeline: { id: string; text: string; actor: string }[]; tasks: { id: string; title: string }[]; offer: { validUntil: string; signedBy: string | null; expired: boolean } };
export type SalesScene = { deals: DemoDeal[]; target: number; rule: { source: string; owner: string; enabled: boolean } };
export type DemoLeadValues = { name: string; company: string; email: string };
export type DemoEditorValues = { note: string; task: string; tag: string; fieldName: string; fieldValue: string; signer: string; consent: boolean; csv: string };
export type PrototypeDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description: string; size?: "sm" | "md" | "lg"; children: ReactNode; footer?: ReactNode };
