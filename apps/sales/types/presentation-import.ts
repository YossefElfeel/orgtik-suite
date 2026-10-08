import type { DemoDeal, SalesScene } from "./presentation";
export type ContactImportField = "name" | "company" | "email" | "value" | "source";
export type ContactImportValues = { csv: string } & Record<ContactImportField,string>;
export type ContactImportProps = { deals: DemoDeal[]; rule: SalesScene["rule"]; actor: string; currency: string; canManage: boolean; onImport: (deals:DemoDeal[])=>void };
