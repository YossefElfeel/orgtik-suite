// Define error response type
export interface ErrorResponse {
  data?: string[];
  errors?: Record<string, string[]>;
  msg?: string;
  message?: string;
  status?: number;
  statusCode?: number;
}

// Define success response type with a dynamic DT
export interface SuccessResponse<DataType = any> {
  data: DataType;
  msg?: string;
  message?: string;
  status?: string;
  success?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export type IPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export interface IPaginated<T> {
  items: T[];
  meta: IPagination;
}
