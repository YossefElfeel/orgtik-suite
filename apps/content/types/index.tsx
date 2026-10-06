import { WebsiteLanguages } from "@/constants";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IPagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  hasNext: boolean;
  totalPages: number;
  hasPrev: boolean;
  page: number;
  limit: number;
}

export interface IPaginated<T> {
  items: T[];
  meta: IPagination;
}

export type LocalizedContent<T = string> = Record<WebsiteLanguages, T>;
