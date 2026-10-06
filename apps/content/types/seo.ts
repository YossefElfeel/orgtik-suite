import { DashboardLanguages } from "@/constants";

export interface ISeoPage {
  type: string;
  id: number;
  sections: { id: number; name: string }[];
}

export interface ISeoPageResponse extends ISeoPage {
  seoKeywords: Array<string>;
  seoTitle: Record<DashboardLanguages, string>;
  seoDescription: Record<DashboardLanguages, string>;
}

// Section Type Schema Interfaces
export interface ISectionTypeSchemaProperty {
  type: string;
  properties?: Record<string, ISectionTypeSchemaProperty>;
  required?: string[];
  description?: string;
}

export interface ISectionTypeSchema {
  type: string;
  properties?: Record<string, ISectionTypeSchemaProperty>;
  items?: ISectionTypeSchemaProperty;
  required?: string[];
}

export interface ISectionType {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isArrayBased: boolean;
  schema: ISectionTypeSchema;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Section Content Interfaces
export interface ISectionContent {
  id: number;
  pageId: number;
  sectionTypeName: string;
  content: Record<string, any> | any[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sectionType: ISectionType;
}

// Update Section Content Request
export interface IUpdateSectionContentRequest {
  content: Record<string, any> | any[];
  isActive?: boolean;
  order?: number;
}
