import type { IProject } from "./projects";
export type CrmReference = { workspaceId: string; contactId: string };
export type CrmConsent = {
  state: "unknown" | "opted_in" | "opted_out";
  source: "manual_mock" | "marketing_mock" | null;
  recordedBy: number | null;
  recordedAt: string | null;
};
export type CanonicalContact = {
  workspaceId: string;
  id: string;
  name: string;
  email: string;
  currency: string;
  companyId: string | null;
  tags: string[];
  consent: CrmConsent;
  attribution: Record<string, unknown>;
};
export type CanonicalDirectory = {
  workspaceId: string;
  managedIn: "crm";
  contacts: CanonicalContact[];
  companies: { id: string; name: string }[];
};
export type MarketingAttribution = {
  operationId: string;
  workspaceId: string;
  campaignId: string;
  leadId: string;
  projectId: string;
  contactPath: string;
  projectPath: string;
  estimate?: number;
  at?: string;
};
export type MarketingDelivery = {
  id?: string;
  kind?: string;
  mode?: string;
  journeyId?: string;
  stepId?: string;
  taskId?: number;
  path?: string;
  operationId: string;
  at?: string;
  eligible?: CrmReference[];
  suppressed?: { contactId: string; reason: string }[];
  sent?: number;
  opened?: number;
  clicked?: number;
};
export type NativeCampaign = {
  id: string;
  projectId: string;
  name: string;
  type: string;
  status: string;
  approvalStatus: string;
  isComplete: boolean;
  configuration: Record<string, unknown>;
  recipientRefs: CrmReference[];
  attribution: MarketingAttribution[];
  deliveries: MarketingDelivery[];
};
export type BrandKit = {
  voice: "warm" | "direct" | "formal";
  audience: string;
  proposition: string;
  companyName: string;
  postalAddress: string;
};
export type EmailDesign = {
  headline: string;
  body: string;
  subject: string;
  cta: string;
  ctaUrl: string;
  direction: "rtl" | "ltr";
  companyName: string;
  postalAddress: string;
  format: { bold: boolean; italic: boolean; bullets: boolean };
  version?: number;
};
export type NativeTemplate = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  senderConfigId: string;
  design: EmailDesign | null;
};
export type Sender = {
  id: string;
  name: string;
  from: string;
  active: boolean;
  domain: { domain: string; state: "verified_mock"; recordedAt: string } | null;
};
export type SocialThread = {
  id: string;
  projectId: string;
  platform: string;
  senderName: string;
  subject: string;
  incoming: { id: string; body: string; at: string; simulated: boolean }[];
  replies: {
    id: string;
    body: string;
    actorName: string;
    actorId: number;
    at: string;
    simulated: boolean;
  }[];
};
export type JourneyStep = {
  id: string;
  type: "entry" | "email" | "wait" | "task";
  days: number;
  templateId?: string;
  taskIds?: number[];
};
export type JourneyRun = {
  id: string;
  operationId: string;
  at: string;
  mode: "dry_run";
  eligible: CrmReference[];
  suppressed: { contactId: string; reason: string }[];
  logs: {
    stepId: string;
    type: JourneyStep["type"];
    dueAt: string;
    state: string;
    simulated: boolean;
  }[];
};
export type Journey = {
  id: string;
  projectId: string;
  campaignId: string;
  name: string;
  steps: JourneyStep[];
  state: string;
  runs: JourneyRun[];
};
export type WritingDraft = {
  id: string;
  topic: string;
  locale: string;
  voice: string;
  headline: string;
  body: string;
  provider: "template_mock";
  at: string;
};
export type MarketingBootstrap = {
  workspaceId: string;
  now: string;
  projects: IProject[];
  project: IProject | null;
  capabilities: {
    manageProjects: boolean;
    editPosts: boolean;
    editCampaigns: boolean;
    manageAudience: boolean;
  };
  campaigns: NativeCampaign[];
  data: {
    socialThreads: SocialThread[];
    journeys: Journey[];
    drafts: WritingDraft[];
    brandKit: BrandKit | null;
    emailDesigns: Record<string, EmailDesign>;
    domains: Record<string, Sender["domain"]>;
  } | null;
};

export type CampaignCandidate = {
  id: string;
  projectId: string;
  title: string;
  type: string;
  status: string;
  approvalStatus: string;
  recipientRefs: CrmReference[];
  capabilities: { canLead: boolean; canSend: boolean };
  configuration: { senderConfigId: string | null; templateId: string | null };
  results: MarketingAttribution[];
};
export type QueuePost = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  approvalStatus: string;
  queueOrder: number;
  canMove: boolean;
};
export type TaskProject = {
  id: number;
  title: string;
  sections: { id: number; title: string }[];
};
export type TaskReference = {
  id: number;
  title: string;
  status: string;
  path: string;
};
export type CampaignResults = {
  campaignId: string;
  deals: {
    leadId: string;
    projectId: string;
    title: string;
    status: string;
    won: boolean;
    value: number;
    estimatedValue: number;
    currency: string;
    contactPath: string;
    projectPath: string;
  }[];
  currencies: {
    currency: string;
    deals: number;
    wonValue: number;
    pipelineEstimate: number;
  }[];
  receipts: MarketingAttribution[];
};
