import type { ICampaignMeta } from "@/types/campaigns";

export interface IAudienceSegmentRules {
  source?: string;
  type?: string;
  interest?: string;
  qualifiedOnly?: boolean;
}

export interface IAudienceSegment {
  id: string;
  name: string;
  description?: string | null;
  rules: IAudienceSegmentRules;
  /** The audience the segment narrows; null means every audience of the project. */
  audienceId?: string | null;
  matchingContactsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAudienceSegmentListParams {
  page?: number;
  limit?: number;
  q?: string;
  audienceId?: string;
}

export interface IAudienceSegmentListResponse {
  items: IAudienceSegment[];
  meta: ICampaignMeta;
}

export interface ICreateAudienceSegmentPayload {
  name: string;
  description?: string;
  rules: IAudienceSegmentRules;
  audienceId?: string | null;
}

export interface IUpdateAudienceSegmentPayload {
  name?: string;
  description?: string;
  rules?: IAudienceSegmentRules;
}

/** Company audience list item (parent of segments): a named list with its contact count. */
export interface ICompanyAudience {
  id: string;
  name: string;
  description?: string | null;
  contactsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICompanyAudienceListParams {
  page?: number;
  limit?: number;
  q?: string;
}

export interface ICompanyAudienceListResponse {
  items: ICompanyAudience[];
  meta: ICampaignMeta;
}

/** Preview returned after uploading a CSV/XLSX audience file. */
export interface IAudienceImportPreview {
  id: string;
  fileName?: string;
  headers: string[];
  preview: Record<string, string>[];
  totalRows: number;
  status: string;
  savedAudienceId?: string | null;
}

export interface ICommitAudienceImportPayload {
  nameColumn: string;
  emailColumn?: string;
  phoneColumn?: string;
  saveAsCompanyAudience: boolean;
  audienceName?: string;
}

/** Result of committing an audience import with column mapping. */
export interface IAudienceImportCommitResult {
  id: string;
  status: string;
  importedCount?: number;
  skippedCount?: number;
  audienceId?: string | null;
  audience?: ICompanyAudience;
}
