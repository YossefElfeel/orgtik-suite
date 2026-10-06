import type { ICampaignMeta } from "@/types/campaigns";

export type MessagingChannel = "EMAIL" | "SMS" | "WHATSAPP";

export interface IEmailSenderConfiguration {
  from: string;
  host: string;
  port: number;
  secure: boolean;
}

export interface ISmsSenderConfiguration {
  method: string;
  endpoint: string;
  bodyTemplate: string;
}

export interface IWhatsappSenderConfiguration {
  apiVersion: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
}

export type ISenderConfiguration =
  | IEmailSenderConfiguration
  | ISmsSenderConfiguration
  | IWhatsappSenderConfiguration;

export interface ISenderConfig {
  id: string;
  channel: MessagingChannel;
  name: string;
  isActive: boolean;
  configuration: ISenderConfiguration;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISenderConfigListParams {
  page?: number;
  limit?: number;
  q?: string;
  channel?: MessagingChannel;
}

export interface ISenderConfigListResponse {
  items: ISenderConfig[];
  meta: ICampaignMeta;
}

export interface IMessagingTemplateProviderData {
  status?: string;
  category?: string;
  language?: string;
  templateName?: string;
}

export interface IMessagingTemplate {
  id: string;
  projectId: string | null;
  channel: MessagingChannel;
  senderConfigId: string;
  name: string;
  subject: string | null;
  body: string;
  variables: string[];
  providerData: IMessagingTemplateProviderData;
  isActive: boolean;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMessagingTemplateListParams {
  page?: number;
  limit?: number;
  q?: string;
  channel?: MessagingChannel;
}

export interface IMessagingTemplateListResponse {
  items: IMessagingTemplate[];
  meta: ICampaignMeta;
}

export interface ICreateMessagingTemplatePayload {
  channel: MessagingChannel;
  name: string;
  subject?: string;
  body: string;
  variables?: string[];
  senderConfigId?: string;
  providerData?: Record<string, unknown>;
}
