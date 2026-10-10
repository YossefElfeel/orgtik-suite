import type { Customer } from "./customers";
import type { ProjectDetail } from "./projects";
export type CrmLabel = string | Record<string, string>;
export type CrmStage = {
  id: string;
  name: CrmLabel;
  probability: number;
  status: string;
};
export type CrmPipeline = { id: string; name: CrmLabel; stages: CrmStage[] };
export type CrmField = {
  id: string;
  name: CrmLabel;
  type: "text" | "number" | "checkbox";
};
export type CrmCompany = {
  id: string;
  name: string;
  sector: string;
  website: string;
  notes: string;
  tags: string[];
  fields: Record<string, string | number | boolean>;
};
export type CrmActivity = {
  id: string;
  contactId: string;
  kind: string;
  text: string;
  actorId: number;
  actorName: string;
  at: string;
  simulated?: boolean;
  scheduledAt?: string;
};
export type CrmContact = Customer & {
  pipelineId: string;
  stageId: string;
  probability: number;
  value: number;
  currency: string;
  tags: string[];
  fields: Record<string, string | number | boolean>;
  companyId: string | null;
  company: CrmCompany | null;
  taskIds: number[];
  canEdit: boolean;
  attribution: Record<string, unknown>;
  activities: CrmActivity[];
  marketingConsent: {
    state: "opted_in" | "opted_out" | "unknown";
    source: "manual_mock" | null;
    recordedBy: number | null;
    recordedAt: string | null;
  };
};
export type CrmProject = ProjectDetail & {
  pipelineId: string;
  stageId: string;
  probability: number;
  value: number;
  currency: string;
  won: boolean;
  provisioning: Record<string, unknown> | null;
  canEdit: boolean;
  contactId: string;
};
export type CrmConfig = {
  pipelines: CrmPipeline[];
  fields: CrmField[];
  routing: { id: string; source: string; ownerId: string; enabled: boolean }[];
  targets: { currency: string; amount: number; period: string }[];
};
export type CrmBootstrap = CrmConfig & {
  now: string;
  contacts: CrmContact[];
  projects: CrmProject[];
  companies: CrmCompany[];
  activities: CrmActivity[];
  runs: {
    id: string;
    at: string;
    actor: string;
    results: { contactId: string; ownerId: string }[];
  }[];
  owners: { id: string; userId: number; name: string }[];
  capabilities: { canWrite: boolean; canConfigure: boolean; canMerge: boolean };
  sample: { loaded: boolean; canLoad: boolean };
};
export type CrmContactInput = {
  fullName: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  countryCode: string;
  value: number;
};
export type CrmContactPatch = Partial<{
  pipelineId: string;
  stageId: string;
  probability: number;
  value: number;
  tags: string[];
  fields: Record<string, string | number | boolean>;
  companyId: string;
  ownerId: string;
  taskIds: number[];
  lostReason: string;
  marketingConsent: "opted_in" | "opted_out" | "unknown";
}>;
export type CrmImportResult = {
  index: number;
  state: "created" | "failed";
  id?: string;
  code?: string;
};
export type CrmImportForm = { source: string; mapping: Record<string,string> };
export type CrmTaskProject = {id:number;title:string;sections:{id:number;title:string}[]};
export type CrmFollowupForm = {title:string;projectId:string;sectionId:string};
export type CrmBulkResult = {
  id: string;
  state: "saved" | "failed";
  code?: string;
};
export type CrmActivityInput = {
  kind: "note" | "call" | "email" | "meeting" | "whatsapp" | "click_to_call";
  text: string;
  scheduledAt?: string;
};
export type CrmOfferMetadata = {
  id: string;
  validUntil: string | null;
  signature: { name: string; at: string; simulated: true } | null;
  canEdit: boolean;
  now: string;
};
export type CrmConfigForm = {
  kind: "pipeline" | "stage" | "field" | "routing" | "target";
  name: string;
  probability: number;
  status: string;
  type: "text" | "number" | "checkbox";
  source: string;
  ownerId: string;
  amount: number;
  currency: string;
  period: string;
};
export type CrmProvisioningReceipt =
  | {
      state: "provisioned";
      workspaceId: string;
      workspaceName: string;
      ownerUserId: number;
      at: string;
    }
  | { state: "awaiting_owner_signup"; email: string; signupPath: string };
export type CrmProvisioningCandidate = {
  canProvision: boolean;
  projectId: string;
  projectName: string;
  won: boolean;
  customer: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  } | null;
  receipt: CrmProvisioningReceipt | null;
};
