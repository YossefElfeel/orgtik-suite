export interface SuccessResponse<DataType = any> {
  status: string;
  message: string;
  data: DataType;
}

export interface ErrorResponse {
  message: string;
  http_code: number;
  error: string | string[];
  data: null | string | Record<string, string[]>;
}

export interface PaginatedData<DataType = any> {
  items: DataType[];
  meta: Pagination;
}

export type IPaginatedResponse<T> = PaginatedData<T>;

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  roleIds?: number[];
}

export type QueryParams = void | Record<string, string>;
